import React, {useState, useEffect} from 'react';
import MonthComponent from './MonthComponent';
import SelectedDateComponent from './SelectedDateComponent';
import SalesComponent from './SalesComponent';

let date = new Date();
let dd = String(date.getDate()).padStart(2, '0');
let mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
let yyyy = date.getFullYear();

date = yyyy+'-'+mm+'-'+dd;

const Admin = ()  => {
    const [selectedDate, setSelectedDate] = useState(date);
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState([]);
    let [monthlyTable, setMonthlyTable] = useState([]);

    const setDate = () => {
        //reseting selected month to empty array on every change of date
        setSelectedMonth([]);
        const dateInput = document.getElementById('date-input');
        let date = dateInput.value;
        setSelectedDate(date);
    }

    // get All sales from database
    const getSales = async () => {
        try {
            const response = await fetch(`http://localhost:5000/sales`);
            const sales = await response.json();
            setSales(sales);
            setFilteredSales(sales);
        } catch (error) {
            console.log(error);
        }
    }

    //get sales based on date
    const getSpecificSales = () => {
        let day = selectedDate.slice(8,10);
        let month = selectedDate.slice(5,7);
        let year = selectedDate.slice(0,4);
        //map through sales and filter by date
        let filteredSales = sales.filter(sale => {
            let saleDay = ('0' + sale.sale_day).slice(-2);
            let saleMonth = ('0' + sale.sale_month).slice(-2);
            let saleYear = sale.sale_year;
            return saleDay == day && saleMonth == month && saleYear == year;
        })
        setFilteredSales(filteredSales)
    }

    const monthDetail = () => {
        //loop through selectedMonth and group each sale by sale_day
        let groupedSales = [];
        selectedMonth.map(sale => {
            let saleDay = ('0' + sale.sale_day).slice(-2);
            let total = sale.sale_total;
            let alimentation = sale.total_1
            let magazines = sale.total_2
            let decoration = sale.total_3
            let splitted = sale.sale_splitted
            let paymentMethod = sale.payment_method_id
            let paymentMethod2 = sale.payment_method_id_2
            let paymentMethod2Total = sale.payment_method_id_2_total
            let horsTaxeAlimentation = sale.hors_taxe_1
            let horsTaxeMagazines = sale.hors_taxe_2
            let horsTaxeDecoration = sale.hors_taxe_3
            let tvaAlimentation = sale.tva_1
            let tvaMagazines = sale.tva_2
            let tvaDecoration = sale.tva_3
            let totalCash = 0
            let totalCard = 0
            let totalCheque = 0
            //if paymentMethod = 1, add total to totalCash
            if(paymentMethod == 1){
                totalCash = total;
            }
            //if paymentMethod = 2, add total to totalCard
            if(paymentMethod == 2){
                totalCard = total;
            }
            //if paymentMethod = 3, add total to totalCheque
            if(paymentMethod == 3){
                totalCheque = total;
            }
            if (splitted) {
                if(paymentMethod == 1){
                    totalCash = total - paymentMethod2Total;
                }
                //if paymentMethod = 2, add total to totalCard
                if(paymentMethod == 2){
                    totalCard = total - paymentMethod2Total;
                }
                //if paymentMethod = 3, add total to totalCheque
                if(paymentMethod == 3){
                    totalCheque = total - paymentMethod2Total;
                }
                // if paymentMethod2 = 1, add paymentMethod2Total to totalCash
                if(paymentMethod2 == 1){
                    totalCash += paymentMethod2Total;
                }
                // if paymentMethod2 = 2, add paymentMethod2Total to totalCard
                if(paymentMethod2 == 2){
                    totalCard += paymentMethod2Total;
                }
                // if paymentMethod2 = 3, add paymentMethod2Total to totalCheque
                if(paymentMethod2 == 3){
                    totalCheque += paymentMethod2Total;
                }
                
            }

            let index = groupedSales.findIndex(groupedSale => groupedSale.sale_day == saleDay);
            if(index == -1){
                groupedSales.push({
                    sale_day: saleDay, 
                    alimentation: Math.round(alimentation*100)/100, 
                    magazines : magazines, 
                    décoration: decoration, 
                    totalCash: totalCash, 
                    totalCard: totalCard, 
                    totalCheque: totalCheque,
                    horsTaxeAlimentation: horsTaxeAlimentation,
                    horsTaxeMagazines: horsTaxeMagazines,
                    horsTaxeDecoration: horsTaxeDecoration,
                    tvaAlimentation: tvaAlimentation,
                    tvaMagazines: tvaMagazines,
                    tvaDecoration: tvaDecoration, 
                    total: total});
            } else {
                groupedSales[index].total += Math.round(total *100)/100;
                groupedSales[index].alimentation += Math.round(alimentation*100)/100;
                groupedSales[index].magazines += Math.round(magazines*100)/100;
                groupedSales[index].décoration += Math.round(decoration*100)/100;
                groupedSales[index].totalCash += Math.round(totalCash*100)/100;
                groupedSales[index].totalCard += Math.round(totalCard*100)/100;
                groupedSales[index].totalCheque += Math.round(totalCheque*100)/100;
                groupedSales[index].horsTaxeAlimentation += Math.round(horsTaxeAlimentation*100)/100;
                groupedSales[index].horsTaxeMagazines += Math.round(horsTaxeMagazines*100)/100;
                groupedSales[index].horsTaxeDecoration += Math.round(horsTaxeDecoration*100)/100;
                groupedSales[index].tvaAlimentation += Math.round(tvaAlimentation*100)/100;
                groupedSales[index].tvaMagazines += Math.round(tvaMagazines*100)/100;
                groupedSales[index].tvaDecoration += Math.round(tvaDecoration*100)/100;
            }
        })
        setMonthlyTable(groupedSales);
    }

    useEffect(() => {
        getSales();
    }, []);

    useEffect(() => {
        getSpecificSales();
    }, [sales]);

    useEffect(() => {
        getSpecificSales();
    }, [selectedDate]);

    useEffect(() => {
        monthDetail();
    }, [sales]);

    useEffect(() => {
        monthDetail()
    }, [selectedMonth]);


    
    return (
        <div className="grid-container grid-container--admin">
            <div className="flex heading-section">
                <h1 className="fs-700">Admin</h1>
                <input id="date-input" type="date" defaultValue={date} onChange={setDate}/>
            </div>
            <div className="admin-totals-container flex">
                <MonthComponent selectedDate={selectedDate} selectedMonth={selectedMonth} sales={sales} monthlyTable={monthlyTable}/>
                <SelectedDateComponent selectedDate={selectedDate} filteredSales={filteredSales} />
            </div>
            <div className="sales-container">
                {filteredSales ? <SalesComponent filteredSales={filteredSales} /> : <h3>Loading...</h3>}
            </div>
        </div>
    )
}

export default Admin;