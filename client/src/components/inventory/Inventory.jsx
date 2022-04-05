import React, {useState, useEffect} from 'react';
import DisplayProductComponent from './DisplayProductComponent';
import CreateProduct from './CreateProductComponent';


const Inventory = () => {

    const [barcode, setBarcode] = useState('');
    const [product, setProduct] = useState();
    const [newProduct, setNewProduct] = useState(false);
    const [mode, setMode] = useState('update');
    
    const getProduct = async () => {
        const barcodeInput = document.getElementById('barcode-input');
        const barcodeString = barcodeInput.value;
        if(barcodeString.slice(-2) === '/n'){
            try {
                const findProduct = await fetch(`http://localhost:5000/products/${barcodeString.slice(0, -2)}`);
                const product = await findProduct.json();
                console.log(product);
                setProduct(product);
            } catch {
                // ADD PRODUCT COMPONENT GOES HERE
                console.log('product not found');
                setNewProduct(true);
            }
        }
    }

    const editProduct = async () => {
        // set the values of the inputs to the values of the product
        product.product_name = document.getElementById('product-name').value;
        product.product_price = parseFloat(document.getElementById('product-price').value);
        product.taxe_id = parseInt(document.getElementById('product-taxe-id').value);
        product.product_alert = parseInt(document.getElementById('product-alert').value);
        if (mode ==='update'){
        product.product_quantity = parseInt(document.getElementById('product-quantity').value);
        } else if (mode === 'delivery'){
            product.product_quantity = parseInt(document.getElementById('product-quantity').value) + parseInt(product.product_quantity);
        }
        //update the product in the database
        try {
            const body = {
                name : product.product_name,
                price : product.product_price,
                quantity : product.product_quantity,
                alert : product.product_alert,
                taxe_id : product.taxe_id
            }
            const updateProduct = await fetch(`http://localhost:5000/products/${barcode.slice(0, -2)}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body)
            });
            const response = await updateProduct.json();
            console.log(response);
            // show alert that product has been updated
            alert('Product has been updated');
            //reset the product and barcode input
            setProduct()
            setBarcode('')
        } catch (err) {
            console.error(err.message)
        }
    }

    const addProduct = async () => {
        // set the values of the inputs to the values of the product
        const name = document.getElementById('product-name').value;
        const price = parseFloat(document.getElementById('product-price').value);
        const quantity = parseInt(document.getElementById('product-quantity').value);
        const alert = parseInt(document.getElementById('product-alert').value);
        const taxe_id = parseInt(document.getElementById('product-taxe-id').value);
        const product_barcode = barcode.slice(0, -2);

        try {
            const body = {
                name: name,
                price: price,
                quantity: quantity,
                alert: alert,
                taxe_id: taxe_id,
                barcode: product_barcode
            }
            const addProduct = await fetch(`http://localhost:5000/products`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body)
            });
            const response = await addProduct.json();
            console.log(response);
            // show alert that product has been added

            // //reset the product and barcode input
            setProduct()
            setBarcode('')

        } catch (err) {
            console.error(err.message)
        }
    }

    const changeMode = () => {
        if (mode === 'update') {
            setMode('delivery');
        } else if (mode === 'delivery') {
            setMode('update');
        }
    }

    const reset = () => {
        // document.getElementById('inventory-input').value = '';
        setBarcode('');
        setProduct();
        // focus on barcode input
        document.getElementById('barcode-input').focus();
    }

    useEffect(() => {
        setProduct();
        setNewProduct(false);
        getProduct()
    }, [barcode])

    return (
        <div className="grid-container grid-container--inventory">
            <div className="flex heading-section">
                <h1 className="fs-700">Inventory</h1>
                <button className="btn btn-outline-neutral" onClick={changeMode}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</button>
            </div>
            <div className="inventory-container">
                <div className="flex">
                    <input id="barcode-input" className="form-control" placeholder="Scan Barcode" value={barcode} onChange={e => setBarcode((e.target.value))} aria-label="Search Barcode" id="barcode-input" autoFocus />
                    <button className="btn btn-outline-neutral" onClick={() => reset()}>Reset</button>
                </div>

                {product ? <DisplayProductComponent product={product} editProduct={editProduct}/> : null}
                {newProduct ? <CreateProduct addProduct={addProduct}/> : null}
            </div>
        </div>
    )
}

export default Inventory;