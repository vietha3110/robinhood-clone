from flask import Blueprint, jsonify, session, request
from app.models import User, db, Transaction
from app.forms import LoginForm
from app.forms import SignUpForm
from flask_login import current_user, login_user, logout_user, login_required

auth_routes = Blueprint('auth', __name__)


def validation_errors_to_error_messages(validation_errors):
    """
    Simple function that turns the WTForms validation errors into a simple list
    """
    errorMessages = []
    for field in validation_errors:
        for error in validation_errors[field]:
            errorMessages.append(f'{field} : {error}')
    return errorMessages


@auth_routes.route('/')
def authenticate():
    """
    Authenticates a user.
    """
    if current_user.is_authenticated:
        return current_user.to_dict()
    return {'errors': ['Unauthorized']}


@auth_routes.route('/login', methods=['POST'])
def login():
    """
    Logs a user in
    """
    form = LoginForm()
    # Get the csrf_token from the request cookie and put it into the
    # form manually to validate_on_submit can be used
    form['csrf_token'].data = request.cookies['csrf_token']
    if form.validate_on_submit():
        # Add the user to the session, we are logged in!
        user = User.query.filter(User.email == form.data['email']).first()
        login_user(user)

        response = user.to_dict()

        # Rating.query(func.avg(Rating.field2)).filter(Rating.url==url_string.netloc)

        def format_response(stock):
            asset = {}
            asset[stock.to_dict()["symbol"].upper()] = stock.to_dict()

            transactions = Transaction.query.filter(Transaction.user_id == 1).filter(
                Transaction.stock_symbol.ilike(stock.to_dict()["symbol"])).filter(Transaction.open == 1).all()

            if transactions:
                sum_price = 0
                sum_quantity = 0
                for transaction in transactions:
                    sum_price = sum_price + \
                        (transaction.price * transaction.quantity)
                    sum_quantity = sum_quantity + transaction.quantity

                avg_price = sum_price / sum_quantity

                asset[stock.to_dict()["symbol"].upper()
                      ]["avgPrice"] = avg_price

            print(asset)
            return asset

        response["assets"] = {asset.to_dict()["symbol"]: format_response(asset)[asset.to_dict()["symbol"]]
                              for asset in user.assets}
        return jsonify(response)
    return {'errors': validation_errors_to_error_messages(form.errors)}, 401


@auth_routes.route('/logout')
def logout():
    """
    Logs a user out
    """
    logout_user()
    return {'message': 'User logged out'}


@auth_routes.route('/signup', methods=['POST'])
def sign_up():
    """
    Creates a new user and logs them in
    """
    form = SignUpForm()
    form['csrf_token'].data = request.cookies['csrf_token']
    if form.validate_on_submit():
        user = User(
            first_name=form.data["first_name"],
            last_name=form.data["last_name"],
            email=form.data['email'],
            password=form.data['password'],
            buying_power=form.data["buying_power"],
            username=form.data["username"]
        )
        db.session.add(user)
        db.session.commit()
        login_user(user)
        return user.to_dict()
    return {'errors': validation_errors_to_error_messages(form.errors)}, 401


@auth_routes.route('/unauthorized')
def unauthorized():
    """
    Returns unauthorized JSON when flask-login authentication fails
    """
    return {'errors': ['Unauthorized']}, 401
