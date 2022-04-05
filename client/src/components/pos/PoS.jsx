import React, { Fragment, useState, useEffect } from 'react';
import CartComponent from './CartComponent';
import TaxeComponent from './TaxeComponent';
import printer from '../../printer'


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
    const [discountPercentage, setDiscountPercentage] = useState(1);
    let [leftToPay, setLeftToPay] = useState(0);
    let [paid, setPaid] = useState(0);

    
    //get last sale transaction id, if sale_paid is true, then create a new sale transaction
    const getLastSale = async () => {
        try {
            const lastSale = await fetch(`http://localhost:5000/last-sale`);
            const lastSaleData = await lastSale.json(); 
            if (lastSaleData.sale_paid === true) {
                const newSale = await fetch(`http://localhost:5000/sales`, {
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
                const product = await fetch(`http://localhost:5000/products/${barcode}`);
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
                alert('Product not found');
                console.log('Product not found');
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
                product_taxe: parseInt(noBarcodeTaxe)
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
                if (product.product_id === parseInt(e.target.parentNode.dataset.id)) {
                    product.product_quantity += 1;
                }
            });
        }
        else if (!productExist) {
            const newProduct = {
                product_id: parseInt(e.target.parentNode.dataset.id),
                product_name: e.target.parentNode.dataset.name,
                product_price: parseFloat(e.target.parentNode.dataset.price),
                product_quantity: 1,
                product_barcode: '',
                product_taxe: parseInt(e.target.parentNode.dataset.taxe_id)
            }
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

    const reset = () => {
        // document.getElementById('inventory-input').value = '';
        setBarcode('');
        // focus on barcode input
        document.getElementById('barcode-input').focus();
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
            const response = await fetch(`http://localhost:5000/sales/${saleId}`);
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
            const response = await fetch(`http://localhost:5000/delete/sales/${saleId}/null`, {
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
        if(total > 0) {
            let paidValue = parseFloat(document.getElementById('left-to-pay').value)
            //set paid state += paid value
            paid += Math.round(paidValue *100)/100;
            leftToPay = Math.round((total - paid) * 100) / 100;
            const checked = document.querySelector('input[name="payment-method"]:checked').value;

            //if editing(true) delete ewerything from the products_in_transactions before adding new products
            if (editing) {
                try {
                    const response = await fetch(`http://localhost:5000/reset/sales/${saleId}`, {
                        method: 'PUT'
                    });
                    const data = await response.json();
                } catch (err) {
                    console.error(err.message)
                }
            }

            if (leftToPay !== 0 && leftToPay > 0) {
                try {
                    const splittedPaiment = await fetch(`http://localhost:5000/close/sales/${saleId}/split`, {
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
                printer()
                if (paidValue > leftToPay) {
                    alert('Change : ' + Math.abs(leftToPay) + ' €')
                }
                try {
                    setAccounting()
                    addProductsInTransaction()
                    updateStock();
                    const close = await fetch(`http://localhost:5000/close/sales/${saleId}`, {
                        method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        paid: checked
                    })
                    });
                    const closeData = await close.json();
                    // window.location.reload();
                    // setPaymentMethod()
                }
                catch (err) {
                    console.error(err.message);
                }
                if (editing) {
                    deleteNull()
                }
                //reset everything
                setProducts([]);
                setTotal(0);
                setPaid(0);
                setLeftToPay(0);
                setQtyUpdated(false);
                setLoaded(false);
                setTaxesId([]);
                setTaxes([]);
                document.getElementById('left-to-pay').value = 0;
                getLastSale()
                document.getElementById('barcode-input').focus()
            }
            setEditing(false)
        }
    }

    // Close Stock update
    const updateStock = async () => {
        for (let i=0; i<products.length; i++) {
            try {
                let id = products[i].product_id;
                let quantity = products[i].product_quantity;
                if (id !== '') {
                    const closeStock = await fetch(`http://localhost:5000/close/products/${id}/stock`, {
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
            const accounting = await fetch(`http://localhost:5000/accounting/sales/${saleId}`, {
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
                    product_taxe: products[i].product_taxe,
                    sale_year: time[`year`],
                    sale_month: String(time[`month`]),
                    sale_day: String(time[`day`])
                }
                const sendProducts = await fetch(`http://localhost:5000/sales/${saleId}/product`, {
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

    const toggleModal = (e) => {
        const modal = document.querySelector(`.${e.target.dataset.toggle}`)
        const modalToggle = document.querySelector(`.${e.target.dataset.toggle}-toggle`)
        const modalDialog = document.querySelector(`.${e.target.dataset.toggle}-dialog`)

        if(e.target.dataset.action === "payment") {
            payment()
        } else if (e.target.dataset.action === "close_transaction") {
            closeTransaction()
        } else if (e.target.dataset.action === "clear_cart") {
            clearTransaction()
        } else if (e.target.dataset.action === "add_no_barcode_product") {
            addNoBarcodeProduct()
        } else if(e.target.dataset.action === "add-discount") {
            discount()
        }

        const visibility = modal.getAttribute("data-visible")
        if (visibility === "false") {
            modal.setAttribute("data-visible", true)
            modal.setAttribute("aria-hidden", false)
            modalToggle.setAttribute("aria-expanded", true)
            modalDialog.setAttribute("data-visible", true)
        } else {
            modal.setAttribute("data-visible", false)
            modal.setAttribute("aria-hidden", true)
            modalToggle.setAttribute("aria-expanded", false)
            modalDialog.setAttribute("data-visible", false)
        }
    }

    const toggleAllCheckboxes = (e) => {
        const checkboxes = document.querySelector('.product-discount-container').querySelectorAll('input[type="checkbox"]')
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked
            })
    }

    const discount = () => {
        const discountAmount = document.getElementById('discount-amount').value
        let discountOperator = discountPercentage - (discountAmount / 100)
        const checkboxes = document.querySelector('.product-discount-container').querySelectorAll('input[type="checkbox"]')
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const index = checkbox.dataset.index
                const product = products[index]
                const newProduct = {
                    ...product,
                    product_price: Math.round((product.product_price * discountOperator)* 100) / 100
                }
                products[index] = newProduct
            }
        })
        setProducts(products)
        setQtyUpdated(true)
    }

    const receipt = () => {
        printer(products, taxes, total, time)
    }



    return (
        <Fragment>
            <div className="grid-container grid-container--pos">
                <div>
                    <div className="heading-section flex">
                        <h1 className="fs-700 ff-source">Sale n° {saleId}</h1>
                        <div className="flex">
                            <input type="number" placeholder="ID" aria-label="Sale ID to edit" id="edit-sale-id" onChange={editOnChange}/>
                            <button id="edit-btn" className="btn btn-outline-neutral" type="button" onClick={editTransaction}>Edit Sale</button>
                        </div>
                    </div>
                    <div className="container">
                        <div className="flex barcode-section">
                            <input className="form-control" value={barcode} onChange={e => setBarcode((e.target.value))} placeholder='Enter barcode' autoFocus id='barcode-input'/>
                            {/* no barcode product */}
                                <button className="btn btn-outline-neutral" onClick={() => reset()}>Reset</button>
                            <button type="button" className="btn btn-outline-neutral no-barcode-modal-toggle" data-toggle="no-barcode-modal" aria-expanded="false" onClick={(e) => toggleModal(e)}>
                                No barcode
                            </button>
                        </div>
                    {/* no barcode product modal */}
                        <div className="modal no-barcode-modal" role="dialog" data-visible="false" aria-hidden="true">
                            <div className="no-barcode-modal-dialog modal-dialog" role="document" data-visible="false">
                                <div>
                                    <div className="modal-header">
                                        <h5 className="fs-500">No Barcode Product</h5>
                                        <button type="button" className="close-btn" data-toggle="no-barcode-modal" onClick={(e) => toggleModal(e)} aria-label="Close">
                                            <span aria-hidden="true" data-toggle="no-barcode-modal">&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="grid">
                                            <div>
                                                <span>Name</span>
                                            </div>
                                            <select name="categories" aria-describedby="no-barcode-name" id="no-barcode-name">
                                                <option value="Magazine">Magazine</option>
                                                <option value="Confiserie">Confiserie</option>
                                                <option value="Bonbon au Poids">Bonbon au Poids</option>
                                                <option value="Produit d'épicerie">Produit d'épicerie</option>
                                                <option value="Décoration">Décoration</option>
                                                <option value="Pain">Pain</option>
                                                <option value="Pâtisserie">Pâtisserie</option>
                                            </select>
                                            {/* <input type="text" /> */}
                                            <div>
                                                <span>Price</span>
                                            </div>
                                            <input type="number" step="0.05" aria-describedby="no-barcode-price" id="no-barcode-price"/>
                                            <div>
                                                <span>Quantity</span>
                                            </div>
                                            <input type="number" aria-describedby="no-barcode-quantity" id="no-barcode-quantity"/>
                                            <div>
                                                <span>Taxe</span>
                                            </div>
                                            <select id="no-barcode-taxe">
                                                <option defaultValue="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="modal-footer flex">
                                        <button type="button" className="btn btn-outline-danger" data-toggle="no-barcode-modal" onClick={(e) => toggleModal(e)}>Close</button>
                                        <button type="button" className="btn btn-outline-success" data-toggle="no-barcode-modal" data-action="add_no_barcode_product" onClick={(e) => toggleModal(e)}>Add Product</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card-container flex">
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
                        <div className="card" style={{"zIndex":"1"}} data-id="1150" data-name="Café/Thé" data-price="2" data-taxe_id="1" onClick={(e) => addProductFromCard(e)}>
                            <img className="card-img-top" src="..." alt="café" />
                            <p className="card-text">Café/Thé</p>
                        </div>
                        {/* ADD PASTRIES MODAL HERE */}
                    </div>
                </div>
                <div className='grid-container cart-container'>
                    <div className='cart-header flex'>
                        <h3 className="fs-600 ff-source">Cart</h3>
                        {/* Clear the cart */}
                        <button type="button" className="btn clear-cart-modal-toggle close-btn" data-toggle="clear-cart-modal" aria-expanded="false" onClick={(e) => toggleModal(e)}>
                            <i className="fas fa-times close-icon clear-cart-modal-toggle" data-toggle="clear-cart-modal"></i>
                        </button>

                        {/* Clear the cart Modal */}
                        <div className="modal clear-cart-modal" id="clearCart" role="dialog" data-visible="false" aria-hidden="true">
                            <div className="modal-dialog clear-cart-modal-dialog" role="document" data-visible="false">
                                <div>
                                    <div className="modal-header">
                                        <h5 className="fs-500">Clear Cart</h5>
                                        <button type="button" className="close-btn" data-toggle="clear-cart-modal" onClick={(e) => toggleModal(e)} aria-label="Close">
                                            <span aria-hidden="true" data-toggle="clear-cart-modal">&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        Are you sure you want to clear the cart ?
                                    </div>
                                    <div className="modal-footer flex">
                                        <button type="button" className="btn btn-outline-danger" data-toggle="clear-cart-modal" onClick={(e) => toggleModal(e)}>Close</button>
                                        <button type="button" className="btn btn-outline-success" data-toggle="clear-cart-modal" data-action="clear_cart" onClick={(e) => toggleModal(e)}>Clear Cart</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="cart">
                        {products.length > 0 ? <CartComponent products={products} setProducts={setProducts} setQtyUpdated={setQtyUpdated}/> : <h3>Cart is empty</h3>} 
                    </div>
                    {/* display total price */}
                    
                    <div className='cart-price-container'>
                        <h3 className='cart-total-price fs-600 ff-source'>TOTAL : <span id="cart-total">{total}</span> €</h3>

                    
                        
                        <div className='grid'>
                            <div className='cart-button-container flex'>
                                <button type="button" className="btn btn-outline-neutral drawer" onClick={() => printer()}>
                                    Drawer
                                </button>
                                <button type="button" className="btn btn-outline-neutral receipt" onClick={() => receipt()}>
                                    Receipt
                                </button>
                                <button type="button" className="btn btn-outline-neutral discount-modal-toggle" data-toggle="discount-modal" onClick={(e) => toggleModal(e)} aria-expanded="false">
                                    Discount
                                </button>
                                <div className="modal discount-modal" role="dialog"  data-visible="false" aria-hidden="true">
                                <div className="modal-dialog discount-modal-dialog" role="document" data-visible="false">
                                    <div>
                                        <div className="modal-header">
                                            <h2 className="fs-500">Add Discount</h2>
                                            <button type="button" className="close-btn" data-toggle="discount-modal" onClick={(e) => toggleModal(e)} aria-label="Close">
                                                <span aria-hidden="true" data-toggle="discount-modal">&times;</span>
                                            </button>
                                        </div>
                                        <div className="modal-body">
                                            
                                            <div className="flex">
                                                <input type="number" aria-describedby="discount amount" id="discount-amount" placeholder="Discount percentage"/>
                                            </div>
                                            <div className="btn btn-discount-container btn-outline-neutral flex">
                                                <input type="checkbox" id="discount-all" onClick={(e) => toggleAllCheckboxes(e)} />
                                                <label htmlFor="discount-all" className="fs-500">Apply to all products</label>
                                            </div>
                                            <div className="product-discount-container grid">
                                                {/* create a checkbox for each product */}
                                                {products.map((product, index) => {
                                                    return (
                                                        <div className="product-discount-checkbox flex fs-400" key={index}>
                                                            <input type="checkbox" id={product.product_id} name={product.product_name} data-index={index} value={product.product_name}/> 
                                                            <p>{product.product_name}</p>
                                                            <p>{product.product_quantity}</p>
                                                            <p>{product.product_price}</p>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        <div className="modal-footer flex">
                                            <button type="button" className="btn btn-outline-danger" data-toggle="discount-modal" onClick={(e) => toggleModal(e)}>Close</button>
                                            <button type="button" className="btn btn-outline-success" data-toggle="discount-modal" data-action="add-discount" onClick={(e) => toggleModal(e)}>Apply Discount</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                        
                        {/* Pay */}
                            <button type="button" className="btn btn-outline-success checkout-modal-toggle" data-toggle="checkout-modal" data-action="payment" onClick={(e) => toggleModal(e)} aria-expanded="false">
                                Check Out
                            </button>
                        {/* Pay Modal */}
                            <div className="modal checkout-modal" role="dialog"  data-visible="false" aria-hidden="true">
                                <div className="modal-dialog checkout-modal-dialog" role="document" data-visible="false">
                                    <div>
                                        <div className="modal-header">
                                            <h2 className="fs-600">Confirm Payment</h2>
                                            <button type="button" className="close-btn" data-toggle="checkout-modal" onClick={(e) => toggleModal(e)} aria-label="Close">
                                                <span aria-hidden="true" data-toggle="checkout-modal">&times;</span>
                                            </button>
                                        </div>
                                        <div className="modal-body">
                                            <div className="taxe-container">
                                                {loaded ? <TaxeComponent taxesId={taxesId} taxes={taxes}/> : <div>Loading...</div>}
                                            </div>
                                            <div className="flex">
                                                <input type="number" step="0.01" aria-describedby="left-to-pay" id="left-to-pay" placeholder="Enter amount if split payment, or click total" defaultValue={leftToPay}/>
                                                <button type="button" className="btn btn-outline-neutral" onClick={remaining}>
                                                    Left to Pay
                                                </button>
                                            </div>
                                            
                                            <div className="payment-method-container">
                                                    <p className="fs-500">Payment Method</p>
                                                <div>
                                                    <input className="payment-method-input" type="radio" name="payment-method" id="cash" value="1" defaultChecked />
                                                    <label className="form-check-label fs-500" htmlFor="cash">
                                                        Cash
                                                    </label>
                                                </div>
                                                <div>
                                                    <input className="payment-method-input" type="radio" name="payment-method" id="card" value="2" />
                                                    <label className="form-check-label fs-500" htmlFor="card">
                                                        Card
                                                    </label>
                                                </div>
                                                <div>
                                                    <input className="payment-method-input" type="radio" name="payment-method" id="cheque" value="3" />
                                                    <label className="form-check-label fs-500" htmlFor="cheque">
                                                        Cheque
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="modal-footer flex">
                                            <button type="button" className="btn btn-outline-danger" data-toggle="checkout-modal" onClick={(e) => toggleModal(e)}>Close</button>
                                            <button type="button" className="btn btn-outline-success" data-toggle="checkout-modal" data-action="close_transaction" onClick={(e) => toggleModal(e)}>Confirm Transaction</button>
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