import React, { useState } from "react";
import { FaBox } from "react-icons/fa";
import "./Products.css";

function Products() {
  const [products, setProducts] = useState([
    
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "", category: "", price: "", currency: "INR", tax: "", discount: "", status: "Active", updated: new Date().toISOString().slice(0, 10), stock: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    setProducts([...products, newProduct]);
    setShowModal(false);
    setNewProduct({ name: "", category: "", price: "", currency: "INR", tax: "", discount: "", status: "Active", updated: new Date().toISOString().slice(0, 10), stock: "" });
  };

  return (
    <div className="products-container">
      <div className="products-header">
        <h2><FaBox /> Products</h2>
      </div>

       <button className="btn-add-product" onClick={() => setShowModal(true)}>+ Add New Product</button>

      <div className="products-table-wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Currency</th>
              <th>Tax Rate (%)</th>
              <th>Discount (%)</th>
              <th>Status</th>
              <th>Updated Date</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
  {products.map((p, index) => (
    <tr key={index}>
      <td data-label="Product Name">{p.name}</td>
      <td data-label="Category">{p.category}</td>
      <td data-label="Price">{p.price}</td>
      <td data-label="Currency">{p.currency}</td>
      <td data-label="Tax Rate (%)">{p.tax}</td>
      <td data-label="Discount (%)">{p.discount}</td>
      <td data-label="Status">
        <span className={`status-badge ${p.status === "Active" ? "active" : "inactive"}`}>
          {p.status}
        </span>
      </td>
      <td data-label="Updated Date">{p.updated}</td>
      <td data-label="Stock">{p.stock}</td>
    </tr>
  ))}
</tbody>
        </table>
      </div>



      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Product</h3>
            <form onSubmit={handleAddProduct}>
              <input type="text" name="name" placeholder="Product Name" value={newProduct.name} onChange={handleChange} required />
              <input type="text" name="category" placeholder="Category" value={newProduct.category} onChange={handleChange} required />
              <input type="number" name="price" placeholder="Price" value={newProduct.price} onChange={handleChange} required />
              <select name="currency" value={newProduct.currency} onChange={handleChange}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
              </select>
              <input type="number" name="tax" placeholder="Tax Rate (%)" value={newProduct.tax} onChange={handleChange} />
              <input type="number" name="discount" placeholder="Discount (%)" value={newProduct.discount} onChange={handleChange} />
              <select name="status" value={newProduct.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <input type="text" name="stock" placeholder="Stock" value={newProduct.stock} onChange={handleChange} />

              <div className="modal-buttons">
                <button type="submit" className="btn-primary">Save</button>
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
