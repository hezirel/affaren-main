import React, { Fragment, useState, useEffect } from 'react';
import CartComponent from './CartComponent';
import TaxeComponent from './TaxeComponent';
import ip from '../../ip'

// get year
let date = new Date();
let dd = String(date.getDate()).padStart(2, '0');
let mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
let yyyy = date.getFullYear();

date = yyyy+'-'+mm+'-'+dd;
//get time
const getTime = () => {
    const date = new Date();
    const time = date.toLocaleTimeString();
    return time;
}

const PoS = () => {
    const [time, setTime] = useState({time:getTime(), 
    day:dd,
    month:mm,
    year:yyyy});
    let [barcode, setBarcode] = useState('');
    const [saleId, setSaleId] = useState('');
    const [editing, setEditing] = useState(false);
    const [products, setProducts] = useState([]);
    const [QtyUpdated, setQtyUpdated] = useState(false);
    const [total, setTotal] = useState(0);
    const [taxesId, setTaxesId] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [loaded, setLoaded] = useState(false);
    let [leftToPay, setLeftToPay] = useState(0);
    let [paid, setPaid] = useState(0);


    //get last sale transaction id, if sale_paid is true, then create a new sale transaction
    const getLastSale = async () => {
        try {
            const lastSale = await fetch(`http://${ip}:5000/last-sale`);
            const lastSaleData = await lastSale.json(); 
            if (lastSaleData.sale_paid === true) {
                const newSale = await fetch(`http://${ip}:5000/sales`, {
                    method: 'POST'
                });
                const newSaleData = await newSale.json();
                setSaleId(newSaleData.sale_id);
            }
            else {
                setSaleId(lastSaleData.sale_id);
            }
        }
        catch (err) {
            console.error(err.message);
        }
    }
    useEffect(() => {
        getLastSale();
    }, []);

    const addProduct = async () => {
        if (barcode !== '') {
            try {
                const product = await fetch(`http://${ip}:5000/products/${barcode}`);
                const productData = await product.json();
                //add product to products list but set product_quantity to 1
                const newProduct = {
                    product_id: productData.product_id,
                    product_name: productData.product_name,
                    product_price: productData.product_price,
                    product_quantity: 1,
                    product_barcode: productData.product_barcode,
                    product_taxe: productData.taxe_id
                }
                setProducts([...products, newProduct]);
                setBarcode('');
                setQtyUpdated(true);
            }
            catch (err) {
                console.error(err.message);
            }
        }
    }

    // add no barcode product
    const addNoBarcodeProduct = () => {
        let noBarcodeName = document.getElementById('no-barcode-name').value;
        let noBarcodePrice = document.getElementById('no-barcode-price').value;
        let noBarcodeQuantity = document.getElementById('no-barcode-quantity').value;
        let noBarcodeTaxe = document.getElementById('no-barcode-taxe').value;
        if (noBarcodeName !== '' && noBarcodePrice !== '' && noBarcodeQuantity !== '' && noBarcodeTaxe !== '') {
            const newProduct = {
                product_id: '',
                product_name: noBarcodeName,
                product_price: noBarcodePrice,
                product_quantity: parseInt(noBarcodeQuantity),
                product_barcode: '',
                product_taxe: noBarcodeTaxe
            }
            setProducts([...products, newProduct]);
            noBarcodeName = '';
            noBarcodePrice = '';
            noBarcodeQuantity = '';
            noBarcodeTaxe = '';
            setQtyUpdated(true);

        }
    }

    // add product from card 
    const addProductFromCard = (e) => {
        //check if product already exist in products list by id and add 1 to product quantity
        const productExist = products.find(product => product.product_id === parseInt(e.target.parentNode.dataset.id));
        if (productExist) {
            products.map(product => {
                console.log("adding qty")
                if (product.product_id === parseInt(e.target.parentNode.dataset.id)) {
                    console.log('found match')
                    product.product_quantity += 1;
                }
            });
        }
        else if (!productExist) {
            console.log('not found match')
            const newProduct = {
                product_id: parseInt(e.target.parentNode.dataset.id),
                product_name: e.target.parentNode.dataset.name,
                product_price: parseFloat(e.target.parentNode.dataset.price),
                product_quantity: 1,
                product_barcode: '',
                product_taxe: parseInt(e.target.parentNode.dataset.taxe_id)
            }
            console.log(newProduct);
            setProducts([...products, newProduct]);
        }
        setQtyUpdated(true);
    }

    //check if product is in transaction
    const checkProduct = async () => {
        const barcodeInput = document.getElementById('barcode-input');
        const barcodeString = barcodeInput.value;
        if (barcode !== '' && barcodeString.slice(-2) === '/n') {
            barcode = barcodeString.slice(0, -2);
            var barcodes = []
            // check if barcode is in products list
            if(products.length > 0) {
                // check all barcodes in products list
                for (let i = 0; i < products.length; i++) {
                    barcodes.push(products[i].product_barcode);
                }
                if (barcodes.includes(barcode.toString())) {
                    products.map(product => {
                        if (product.product_barcode == barcode) {
                            product.product_quantity += 1;
                            setProducts(products);
                            setBarcode('');
                        }
                    })
                }  else {
                    addProduct();
                }
            }
            else {
                addProduct();
            }
        }
        setQtyUpdated(true);
    }

    // get total of actual transaction
    const getTotal = () => {
        let total = 0
        for (let i = 0; i < products.length; i++) {
            // set total state += product_price * product_quantity
            total += products[i].product_price * products[i].product_quantity;
            setTotal(Math.round(total * 100) / 100);
        }
    }

    // PAYMENT
    const payment = () => {
        leftToPay = (total - paid);
    }

    const remaining = () => {
        // setLeftToPay(total - paid);
        let amountInput = document.getElementById('left-to-pay')
        amountInput.value = Math.round(leftToPay *100)/100;
    }

    useEffect(() => {
        setQtyUpdated(false);
        getTotal()
        getTaxes()
        getTaxesId()
    }, [QtyUpdated])

    useEffect(() => {
        if (barcode !== '') {
            checkProduct();
        }
    },[barcode])

    //clear transaction
    const clearTransaction = () => {
        // clear everything
        setProducts([]);
        setTaxesId([]);
        setTaxes([]);
        setTotal(0);
        setQtyUpdated(true);
    }

    //EDIT 
    const editOnChange = () => {
        setEditing(false)
        setTaxesId([]);
    }
    // Set sale id with the id of the sale to edit
    const editTransaction = () => {
        setProducts([])
        const editInput = document.getElementById('edit-sale-id');
        const editId = editInput.value;
        setSaleId(parseInt(editId));
        setEditing(true)
    }
    // get the products of that sale ID and set it to the products list
    const getEditSaleProducts = async () => {
        try {
            const response = await fetch(`http://${ip}:5000/sales/${saleId}`);
            const data = await response.json();
            for(let i = 0; i < data.length; i++) {
                const newProduct = {
                    product_id: data[i].product_id,
                    product_name: data[i].product_name,
                    product_price: data[i].product_price,
                    product_quantity: data[i].quantity,
                    product_taxe: data[i].taxe_id
                }
                // add product to products list
                products.push(newProduct);
                setQtyUpdated(true);
            }
        } catch (err) {
            console.error(err.message)
        }
    }

    //delete null rows when editing
    const deleteNull = async () => {
        try {
            const response = await fetch(`http://${ip}:5000/delete/sales/${saleId}/null`, {
                method: 'DELETE'
            });
            const data = await response.json();
        } catch (err) {
            console.error(err.message)
        }
    }

    useEffect(() => {
        if (editing) {
            getEditSaleProducts();
        }
    }, [editing])

    //TAXES 
    //get taxe id present in transaction
    const getTaxesId = () => {
        for (let i = 0; i < products.length; i++) {
            if (!taxesId.includes(parseInt(products[i].product_taxe))) {
                taxesId.push(products[i].product_taxe);
            }
        }
        setTaxesId(taxesId);
    }

    //get taxes of actual transaction
    const getTaxes = () => {
        if (products.length > 0){
            let taxRate = 0;

            taxes.total_1 = 0
            taxes.total_2 = 0
            taxes.total_3 = 0
            taxes.ht_1 = 0
            taxes.ht_2 = 0
            taxes.ht_3 = 0
            taxes.tva_1 = 0
            taxes.tva_2 = 0
            taxes.tva_3 = 0
            taxes.total_tva = 0

            for(let i = 0; i < products.length; i++) {

                if (products[i].product_taxe == 1) {
                    taxRate = 5.5;
                    taxes.total_1 += Math.round(products[i].product_price * products[i].product_quantity * 100) / 100;
                    
                }
                if (products[i].product_taxe == 2) {
                    taxRate = 2.1;
                    taxes.total_2 += Math.round(products[i].product_price * products[i].product_quantity * 100) / 100;
                    
                }
                if (products[i].product_taxe == 3) {
                    taxRate = 20;
                    taxes.total_3 += Math.round(products[i].product_price * products[i].product_quantity * 100) / 100;
                }
            }
            taxes.ht_1 += Math.round((taxes.total_1/(1 + taxRate /100)) * 100) / 100;
            taxes.tva_1 += Math.round((taxes.total_1 - taxes.ht_1) * 100) / 100;
            taxes.ht_2 += Math.round(taxes.total_2/(1 + taxRate /100) * 100) / 100;
            taxes.tva_2 += Math.round((taxes.total_2 - taxes.ht_2) * 100) / 100;
            taxes.ht_3 += Math.round(taxes.total_3/(1 + taxRate /100) * 100) / 100;
            taxes.tva_3 += Math.round((taxes.total_3 - taxes.ht_3) * 100) / 100;
            taxes.total_tva = taxes.tva_1 + taxes.tva_2 + taxes.tva_3;
            setTaxes(taxes);
            setLoaded(true);
        }
    }   


    // CLOSING TRANSACTION

    //close transaction
    const closeTransaction = async () => {
        const paidValue = parseFloat(document.getElementById('left-to-pay').value)
        //set paid state += paid value
        paid += Math.round(paidValue *100)/100;
        leftToPay = Math.round((total - paid) * 100) / 100;
        const checked = document.querySelector('input[name="payment-method"]:checked').value;

        //if editing(true) delete ewerything from the products_in_transactions before adding new products
        if (editing) {
            try {
                const response = await fetch(`http://${ip}:5000/reset/sales/${saleId}`, {
                    method: 'PUT'
                });
                const data = await response.json();
            } catch (err) {
                console.error(err.message)
            }
        }

        if (leftToPay !== 0 && leftToPay > 0) {
            try {
                const splittedPaiment = await fetch(`http://${ip}:5000/close/sales/${saleId}/split`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        payment_method_id_2: checked,
                        payment_method_id_2_total: paid
                    })
                })
            } catch (err) {
                console.error(err.message)
            }
            setPaid(paid)
        }
        if (leftToPay <= 0) {
            if (paidValue > leftToPay) {
                alert('Change : ' + Math.abs(leftToPay) + ' €')
            }
            try {
                console.log('close transaction');
                setAccounting()
                addProductsInTransaction()
                updateStock();
                const close = await fetch(`http://${ip}:5000/close/sales/${saleId}`, {
                    method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    paid: checked
                })
                });
                const closeData = await close.json();
                alert('Transaction closed');
                window.location.reload();
                // setPaymentMethod()
            }
            catch (err) {
                console.error(err.message);
            }
            if (editing) {
                deleteNull()
            }
        }
        setEditing(false)
    }

    // Close Stock update
    const updateStock = async () => {
        for (let i=0; i<products.length; i++) {
            try {
                let id = products[i].product_id;
                let quantity = products[i].product_quantity;
                if (id !== '') {
                    const closeStock = await fetch(`http://${ip}:5000/close/products/${id}/stock`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            quantity: quantity
                        })
                    });
                    const closeStockData = await closeStock.json();
                }
            }
            catch (err) {
                console.error(err.message);
            }
        }
    }

    // Set all the accounting info in the database
    const setAccounting = async () => {
        try {
            const body = {
                hors_taxe_1: taxes[`ht_1`],
                hors_taxe_2: taxes[`ht_2`],
                hors_taxe_3: taxes[`ht_3`],
                tva_1: taxes[`tva_1`],
                tva_2: taxes[`tva_2`],
                tva_3: taxes[`tva_3`],
                total_1: taxes[`total_1`],
                total_2: taxes[`total_2`],
                total_3: taxes[`total_3`],
                sale_total: Math.round(total * 100) / 100,
                taxe_amount: Math.round(taxes[`total_tva`] * 100) / 100,
                sale_year: time[`year`],
                sale_month: String(time[`month`]),
                sale_day: String(time[`day`]),
                sale_time: time[`time`]
            }
            const accounting = await fetch(`http://${ip}:5000/accounting/sales/${saleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            const accountingData = await accounting.json();
        }
        catch (err) {
            console.error(err.message);
        }
    }

    //send all the products in products_in_transaction
    const addProductsInTransaction = async () => {
        for (let i = 0; i < products.length; i++) {
            try {
                const body = {
                    product_id: parseInt(products[i].product_id),
                    product_name: products[i].product_name,
                    product_quantity: products[i].product_quantity,
                    product_price: products[i].product_price,
                    product_taxe: products[i].product_taxe
                }
                const sendProducts = await fetch(`http://${ip}:5000/sales/${saleId}/product`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                })
            } catch (err) {
                console.error(err.message);
            }
        }
    }



    return (
        <Fragment>
            <div className="container-fluid text-center p-4 row">
                <div className="col-md-8">
                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
                        <h1 className="h2">Point Of Sale</h1>
                        <div className="btn-toolbar mb-2 mb-md-0">
                            <div className="btn-toolbar input-group input-group-sm mb-2 mb-md-0">
                                <input type="number" className="form-control" placeholder="ID" aria-label="Sale ID to edit" id="edit-sale-id" onChange={editOnChange}/>
                                <div className="input-group-append">
                                    <button id="edit-btn" className="btn btn-sm btn-outline-dark" type="button" onClick={editTransaction}>Edit Sale</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <h3 className={saleId}>Sale number : {saleId}</h3>
                    <div className="input-group mt-5 mb-3">
                        <input className="form-control" value={barcode} onChange={e => setBarcode((e.target.value))} placeholder='Enter barcode' autoFocus id='barcode-input'/>
                        {/* no barcode product */}
                        <button type="button" className="btn btn-outline-dark" data-toggle="modal" data-target="#withoutBarcodeModal">
                            No barcode
                        </button>
                    {/* no barcode product modal */}
                        <div className="modal fade" id="withoutBarcodeModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title" id="exampleModalLabel">No Barcode Product</h5>
                                        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="input-group mb-3">
                                            <div className="input-group-prepend">
                                                <span className="input-group-text">Name</span>
                                            </div>
                                            <input type="text" className="form-control" aria-label="Default" aria-describedby="no-barcode-name" id="no-barcode-name"/>
                                            <div className="input-group-prepend">
                                                <span className="input-group-text" >Price</span>
                                            </div>
                                            <input type="number" step="0.05" className="form-control" aria-label="Default" aria-describedby="no-barcode-price" id="no-barcode-price"/>
                                            <div className="input-group-prepend">
                                                <span className="input-group-text">Quantity</span>
                                            </div>
                                            <input type="number" className="form-control" aria-label="Default" aria-describedby="no-barcode-quantity" id="no-barcode-quantity"/>
                                            <div className="input-group-prepend">
                                                <label className="input-group-text" htmlFor="no-barcode-taxe">Taxe</label>
                                            </div>
                                            <select className="custom-select" id="no-barcode-taxe">
                                                <option defaultValue="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                                        <button type="button" className="btn btn-outline-success" onClick={addNoBarcodeProduct} data-dismiss="modal">Add Product</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row justify-content-between grid-container">
                        <div className="card" style={{"zIndex":"1"}} data-id="1132" data-name="Bulle" data-price="3" data-taxe_id="1" onClick={(e) => addProductFromCard(e)}>
                            <img className="card-img-top" src="..." alt="bullar" />
                            <p className="card-text">Bulle</p>
                        </div>
                        <div className="card" style={{"zIndex":"1"}} data-id="1133" data-name="Bullar X4" data-price="10" data-taxe_id="1" onClick={(e) => addProductFromCard(e)}>
                            <img className="card-img-top" src="..." alt="bullar x4" />
                            <p className="card-text">Bullar x4</p>
                        </div>
                        <div className="card" style={{"zIndex":"1"}} data-id="1134" data-name="Sandwich" data-price="6" data-taxe_id="1" onClick={(e) => addProductFromCard(e)}>
                            <img className="card-img-top" src="..." alt="sandwich" />
                            <p className="card-text">Sandwich</p>
                        </div>
                        <div className="card" style={{"zIndex":"1"}} data-id="1135" data-name="Formule sandwich" data-price="10" data-taxe_id="1" onClick={(e) => addProductFromCard(e)}>
                            <img className="card-img-top" src="..." alt="formule sandwich" />
                            <p className="card-text">Formule Sandwich</p>
                        </div>
                    </div>
                </div>
                <div className='col-md-4 cart-container p-2 d-flex flex-column justify-content-between'>
                    <div className='cart-header d-flex justify-content-between align-items-center mb-5'>
                        <h3>Cart</h3>
                        {/* Clear the cart */}
                        <button type="button" className="btn btn-outline-danger" data-toggle="modal" data-target="#clearCart">
                            <i className="fas fa-times"></i>
                        </button>

                        {/* Clear the cart Modal */}
                        <div className="modal fade" id="clearCart" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div className="modal-dialog" role="document">
                            <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLabel">Clear Cart</h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                Are you sure you want to clear the cart ?
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                                <button type="button" className="btn btn-outline-danger" onClick={clearTransaction} data-dismiss="modal">Clear Cart</button>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                    <div className="cart d-flex flex-column">
                        {products.length > 0 ? <CartComponent products={products} setProducts={setProducts} setQtyUpdated={setQtyUpdated}/> : <h3>Cart is empty</h3>}
                        
                    </div>
                    {/* display total price */}
                    
                    <div className='cart-total-price m-5'>
                        <h3 className='cart-total-price font-weight-bold'>TOTAL : <span id="cart-total">{total}</span> €</h3>

                    
                        
                        <div className='row justify-content-center'>
                            <button className="btn btn-dark">Sous-total</button>
                        {/* Pay */}
                            <button type="button" className="btn btn-success" data-toggle="modal" data-target="#confirmModal" onClick={payment}>
                                Check Out
                            </button>
                        {/* Pay Modal */}
                            <div className="modal fade" id="confirmModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                                <div className="modal-dialog modal-dialog-centered" role="document">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title" id="exampleModalLabel">Confirm Payment</h5>
                                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                        </div>
                                        <div className="modal-body">
                                            <div className="taxe-container">
                                                {loaded ? <TaxeComponent taxesId={taxesId} taxes={taxes}/> : <div>Loading...</div>}
                                            </div>
                                            <div className="input-group mb-3">
                                            <input type="number" step="0.01" className="form-control" aria-label="Default" aria-describedby="left-to-pay" id="left-to-pay" placeholder="Enter amount if split payment, or click total" defaultValue={leftToPay}/>
                                            <button type="button" className="btn btn-secondary" onClick={remaining}>
                                                Left to Pay
                                            </button>
                                            </div>
                                            Payment Method
                                            <div className="payment-method-container">
                                                <div className="form-check">
                                                    <input className="form-check-input payment-method-input" type="radio" name="payment-method" id="cash" value="1" defaultChecked />
                                                    <label className="form-check-label" htmlFor="cash">
                                                        Cash
                                                    </label>
                                                </div>
                                                <div className="form-check">
                                                    <input className="form-check-input payment-method-input" type="radio" name="payment-method" id="card" value="2" />
                                                    <label className="form-check-label" htmlFor="card">
                                                        Card
                                                    </label>
                                                </div>
                                                <div className="form-check">
                                                    <input className="form-check-input payment-method-input" type="radio" name="payment-method" id="cheque" value="3" />
                                                    <label className="form-check-label" htmlFor="cheque">
                                                        Cheque
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="modal-footer">
                                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                                            <button type="button" className="btn btn-outline-success" onClick={closeTransaction} data-dismiss="modal">Confirm Transaction</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}

export default PoS;