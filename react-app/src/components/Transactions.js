import { useEffect, useReducer, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getOneDayPrices } from "../util/util2";
import "../stylesheets/Transactions.css";
import AddStock from "./WatchList/WatchlistStock/AddStock";

async function grabLatestPrice(symbol) {
    const data = await getOneDayPrices(symbol);
    return data;
}

function formatTransactionAmount(event) {
    let dollar;
    const transactionDollar = Intl.NumberFormat("en-US", { maximumFractionDigits: 2, roundingMode: "trunc" });
    if (event.target.value.split(".")[1]?.length > 2) dollar = transactionDollar.format(event.target.value.slice(0, -1));
    else if (event.target.value[event.target.value.length - 1] === ".") dollar = transactionDollar.format(event.target.value) + ".";
    else if (event.target.value[event.target.value.length - 1] === "0" && event.target.value[event.target.value.length - 2] === ".") dollar = transactionDollar.format(event.target.value) + ".0";
    else dollar = transactionDollar.format(event.target.value);

    return dollar;
}

const loadTimes = [1000, 900, 200, 700, 3000, 2000, 1800, 400, 6000, 4200, 300, 3000, 2100, 1100];

function Transactions() {
    const usDollar = Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const optionContainer = useRef(null);
    const [errors, setErrors] = useState({});
    const [submittingOrder, setSubmittingOrder] = useState(false);
    const [sharesOrDollars, setSharesOrDollars] = useState("dollars");
    const [showSharesOrDollars, setShowSharesOrDollars] = useState(false);
    const [transactionAmount, setTransactionAmount] = useState("");
    const [sharePrice, setSharePrice] = useState(0);
    const [buyOrSale, setBuyOrSale] = useState("buy");
    const [estQuantity, setEstQuantity] = useState(0);
    const [loading, setLoading] = useState(true);
    const buyingPower = useSelector(state => state.session.user.buyingPower);
    const ownedShares = 2;
    const symbol = useParams().symbol.toUpperCase();

    useEffect(async () => {
        const price = await grabLatestPrice(symbol);
        setSharePrice(price.data[price.data.length - 1]);
    }, [symbol]);

    useEffect(() => {
        if (!showSharesOrDollars) return;

        const onClick = (e) => {
            if (optionContainer.current && optionContainer.current.contains(e.target) === false) {
                setShowSharesOrDollars(false);
            }
        };


        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, [showSharesOrDollars]);

    async function submitOrder(e) {
        e.preventDefault();
        setLoading(true);
        const randomIndex = Math.floor(Math.random() * (loadTimes.length + 1));
        const latestPrice = await grabLatestPrice(symbol);

        setTimeout(() => {
            setLoading(false);
            setSharePrice(latestPrice.data[latestPrice.data.length - 1]);
            setTimeout(() => {
                setSubmittingOrder(false);
            }, 2500);
        }, loadTimes[randomIndex]);
    }

    return (
        <div id="transactions-outer-container">
            <div id="transactions-and-watchlist-container">
                <div id="transaction-container">
                    <div id="transaction-heading-container">
                        <p
                            onClick={() => {
                                setBuyOrSale("buy");
                                setTransactionAmount("");
                                setEstQuantity(0);
                                setErrors({});
                            }}
                            style={buyOrSale === "buy" ? { userSelect: "none", cursor: "default" } : {}}
                            id={buyOrSale === "buy" ? "transaction-tab-buy" : ""}
                            className="transaction-tab">
                            {`Buy ${symbol}`}
                        </p>
                        {ownedShares > 0 && <p
                            onClick={() => {
                                setBuyOrSale("sell");
                                setTransactionAmount("");
                                setEstQuantity(0);
                                setErrors({});
                            }}
                            id={buyOrSale === "sell" ? "transaction-tab-sell" : ""}
                            style={buyOrSale === "sell" ? { userSelect: "none", cursor: "default" } : {}}
                            className="transaction-tab">
                            {`Sell ${symbol}`}
                        </p>}
                    </div>

                    <form id="transaction-form" onSubmit={submitOrder}>
                        <div className="transaction-form-data-container" style={{ userSelect: "none" }}>
                            <p>Order Type</p>
                            <p>Market Order</p>
                        </div>
                        <div className="transaction-form-data-container">
                            <label style={{ userSelect: "none" }}>Buy In</label>
                            <div ref={optionContainer} className={`transaction-shares-or-dollars-outer-container `} id={showSharesOrDollars ? "transaction-shares-or-dollars-outer-container" : ""}>
                                <button onClick={() => {
                                    setShowSharesOrDollars(!showSharesOrDollars);
                                }}
                                    id="transaction-shares-or-dollars-display">
                                    {sharesOrDollars === "dollars" ? "Dollars" : "Shares"}
                                    <i className="fa-solid fa-up-down" />
                                </button>
                                {showSharesOrDollars &&
                                    <div className={`transaction-shares-or-dollars-container ${showSharesOrDollars ? "transactions-shares-or-dollars-open" : ""}`}>
                                        <button
                                            className={`transactions-show-shares-or-dollars
                                            ${buyOrSale === "buy" && sharesOrDollars === "dollars" ? "transaction-green" :
                                                    buyOrSale === "sell" && sharesOrDollars === "dollars" ? "transaction-red" : "transaction-not-active"
                                                }`
                                            }
                                            onClick={e => {
                                                e.preventDefault();
                                                setSharesOrDollars("dollars");
                                                setShowSharesOrDollars(false);
                                                setTransactionAmount("");
                                                setEstQuantity(0);
                                                setErrors({});
                                            }}
                                        >
                                            Dollars
                                        </button>
                                        <button
                                            className={`transactions-show-shares-or-dollars
                                            ${buyOrSale === "buy" && sharesOrDollars === "shares" ? "transaction-green" :
                                                    buyOrSale === "sell" && sharesOrDollars === "shares" ? "transaction-red" : "transaction-not-active"
                                                }`
                                            }
                                            onClick={e => {
                                                e.preventDefault();
                                                setSharesOrDollars("shares");
                                                setShowSharesOrDollars(false);
                                                setTransactionAmount("");
                                                setEstQuantity(0);
                                                setErrors({});
                                            }}
                                        >
                                            Shares
                                        </button>
                                    </div>
                                }
                            </div>
                        </div>
                        <div className="transaction-form-data-container" id="transaction-amount">
                            <p style={{ userSelect: "none" }}>Amount</p>
                            <input type="text"
                                id="transaction-form-text-input"
                                className={errors.amount ? "transaction-form-error" : ""}
                                placeholder={sharesOrDollars === "dollars" ? "$0.00" : "0"}
                                value={transactionAmount}
                                onChange={(event) => {
                                    setErrors({});
                                    if (event.target.value[0] === "$") {
                                        event.target.value = event.target.value.slice(1);
                                        event.target.value = event.target.value.split(",").join("");
                                    }
                                    if (isNaN(event.target.value) === false) {
                                        // buy conditions
                                        if (buyOrSale === "buy" && sharesOrDollars === "dollars") {
                                            if (Number(buyingPower) >= Number(event.target.value)) {
                                                const dollar = formatTransactionAmount(event);
                                                setTransactionAmount("$" + dollar);
                                                setEstQuantity(Number(event.target.value) / sharePrice);
                                            } else {
                                                setErrors({ amount: "Not enough funds." });
                                            }
                                        }

                                        if (buyOrSale === "buy" && sharesOrDollars === "shares") {
                                            if (Number(buyingPower / sharePrice) >= Number(event.target.value)) {
                                                setTransactionAmount(event.target.value);
                                                setEstQuantity(`$${usDollar.format(Number(event.target.value) * sharePrice)}`);
                                            } else {
                                                setErrors({ amount: "Not enough funds." });
                                            }
                                        }
                                        //sell conditions
                                        if (buyOrSale === "sell" && sharesOrDollars === "dollars") {
                                            if (Number(ownedShares) * Number(sharePrice) >= Number(event.target.value)) {
                                                const dollar = formatTransactionAmount(event);
                                                setTransactionAmount("$" + dollar);
                                                setEstQuantity(Number(event.target.value) / sharePrice);
                                            } else {
                                                setErrors({ amount: "Not enough stock." });
                                            }
                                        }

                                        if (buyOrSale === "sell" && sharesOrDollars === "shares") {
                                            if (Number(ownedShares) >= Number(event.target.value)) {
                                                setTransactionAmount(event.target.value);
                                                setEstQuantity(usDollar.format(Number(event.target.value) * sharePrice));
                                            } else {
                                                setErrors({ amount: "Not enough stock." });
                                            }
                                        }
                                    }
                                }} />
                        </div>
                        <div className="transaction-form-data-container" id="transaction-est-quantity" style={{ userSelect: "none" }}>
                            <p>Est. {sharesOrDollars === "shares" ? "Dollars" : "Shares"} </p>
                            <p>{estQuantity}</p>
                        </div>
                        <div id="transaction-submit-container">
                            <button id="transaction-submit-button" type="submit" onClick={() => setSubmittingOrder(true)} className={`transaction-submit-${buyOrSale}`}>
                                Submit Order
                            </button>
                        </div>
                        {errors.amount &&
                            <div className="transactions-error-container">
                                <i className="fa-solid fa-circle-exclamation"></i>
                                <p>
                                    {errors.amount}
                                </p>
                            </div>
                        }
                    </form>
                    {buyOrSale === "buy" && <div id="transaction-buying-power-container" style={{ userSelect: "none" }}>
                        <p>{`$${usDollar.format(buyingPower)} of buying power available`}</p>
                    </div>}
                    {buyOrSale === "sell" &&
                        sharesOrDollars === "shares" &&
                        <div id="transaction-buying-power-container" style={{ userSelect: "none" }}>
                            <p>{`${ownedShares} ${symbol} share${ownedShares > 1 ? "s" : ""} remaining`}</p>
                        </div>
                    }
                    {buyOrSale === "sell" &&
                        sharesOrDollars === "dollars" &&
                        <div id="transaction-buying-power-container" style={{ userSelect: "none" }}>
                            <p>{`Roughly $${(Number(ownedShares) * Number(sharePrice)).toString().split(".")[0]}${(Number(ownedShares) * Number(sharePrice)).toString().split(".")[1]?.slice(0, 2) ? "." + (Number(ownedShares) * Number(sharePrice)).toString().split(".")[1]?.slice(0, 2) : ""} of ${symbol} remaining`}</p>
                        </div>}
                    {submittingOrder &&
                        <div id="transaction-submitting-order">
                            {
                                loading &&
                                <div id="signup-spinner" />
                            }
                            {
                                !loading &&
                                <div className="transaction-submitted">
                                    <i className="fa-solid fa-check-to-slot" />
                                    <p>Order Successfully Submitted!</p>
                                    <p>Filled at {`${sharePrice.toString().split(".")[0]}.${sharePrice.toString().split(".")[1] ? sharePrice.toString().split(".")[1]?.slice(0, 2) : ""}`} a share</p>
                                </div>
                            }
                        </div>
                    }
                </div>
                <AddStock symbol={symbol} />
            </div >
        </div >
    );
}

export default Transactions;;