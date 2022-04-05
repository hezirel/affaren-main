import React, {useState, useEffect} from 'react';
import MonthlyBestSellersComponent from './MonthlyBestSellersComponent';
import DailyBestSellersComponent from './DailyBestSellersComponent';


let date = new Date();
let dd = String(date.getDate()).padStart(2, '0');
let mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
let yyyy = date.getFullYear();

date = yyyy+'-'+mm+'-'+dd;

const BestSellers = () => {
    const [products, setProducts] = useState([]);
    const [dailyProducts, setDailyProducts] = useState([]);
    const [dailyBestSellers, setDailyBestSellers] = useState([]);
    const [monthlyProducts, setMonthlyProducts] = useState([]);
    const [monthlyBestSellers, setMonthlyBestSellers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(date);

    const setDate = () => {
        const dateInput = document.getElementById('date-input').value;
        setSelectedDate(dateInput);
    }
    
    const getProducts = async () => {
        try {
            const products = await fetch(`http://localhost:5000/best-sellers`);
            const productsJson = await products.json();
            setProducts(productsJson);
        } catch (err) {
            console.error(err.message)
        }
    }
    const getDailyProducts = () => {
        let day = selectedDate.slice(8,10);
        let month = selectedDate.slice(5,7);
        let year = selectedDate.slice(0,4);
        //map through sales and filter by date
        let filteredProducts = products.filter(product => {
            let saleDay = ('0' + product.sale_day).slice(-2);
            let saleMonth = ('0' + product.sale_month).slice(-2);
            let saleYear = product.sale_year;
            return saleDay == day && saleMonth == month && saleYear == year;
        })
        setDailyProducts(filteredProducts)
    }

    const getMonthlyProducts = () => {
        let month = selectedDate.slice(5,7);
        let year = selectedDate.slice(0,4);
        //map through sales and filter by date
        let filteredProducts = products.filter(product => {
            let saleMonth = ('0' + product.sale_month).slice(-2);
            let saleYear = product.sale_year;
            return saleMonth == month && saleYear == year;
        })
        setMonthlyProducts(filteredProducts)
    }

    //console.log how many times each product is sold in the selected date
    const getDailySales = () => {
        let productSales = {};
        dailyProducts.forEach(product => {
            if (productSales[product.product_name]) {
                productSales[product.product_name] += product.quantity;
            } else {
                productSales[product.product_name] = product.quantity;
            }
        })

        //order products by quantity sold
        let orderedProducts = Object.keys(productSales).map(key => {
            return {
                product_name: key,
                quantity: productSales[key]
            }
        }).sort((a,b) => {
            return b.quantity - a.quantity;
        })

        setDailyBestSellers(orderedProducts);
    }
    //console.log how many times each product is sold in the selected month
    const getMonthlySales = () => {
        let productSales = {};

// if product is already in the object, add product.quantity to quantity
// else add product to object with quantity of product.quantity
        monthlyProducts.forEach(product => {
            if (productSales[product.product_name]) {
                productSales[product.product_name] += product.quantity;
            } else {
                productSales[product.product_name] = product.quantity;
            }
        })

        //order products by quantity sold
        let orderedProducts = Object.keys(productSales).map(key => {
            return {
                product_name: key,
                quantity: productSales[key]
            }
        }).sort((a,b) => {
            return b.quantity - a.quantity;
        })
        setMonthlyBestSellers(orderedProducts);
    }

    useEffect(() => {
        getProducts();
    }, [])

    useEffect(() => {
        getDailyProducts()
        getMonthlyProducts()
    }, [products])

    useEffect(() => {
        getDailyProducts()
        getMonthlyProducts()
    }, [selectedDate])

    useEffect(() => {
        getDailySales()
    }, [dailyProducts])

    useEffect(() => {
        getMonthlySales()
    }, [monthlyProducts])

    return (
        <div className="grid-container grid-container--best-sellers">
            <div className="flex heading-section">
                <h1 className="h2">Most Sold Products</h1>
                <input className="form-control" id="date-input" type="date" value={selectedDate} onChange={setDate}/>
            </div>
            <div className="best-sellers-container flex">
                {dailyBestSellers.length > 0 ? <DailyBestSellersComponent selectedDate={selectedDate} dailyBestSellers={dailyBestSellers} /> : null }
                {monthlyBestSellers ? <MonthlyBestSellersComponent selectedDate={selectedDate} monthlyBestSellers={monthlyBestSellers} /> : null}
            </div>
        </div>

    )
}

export default BestSellers;