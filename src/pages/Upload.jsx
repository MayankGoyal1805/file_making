import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import './Upload.css';

function Upload() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        files: [],
        projectName: '',
        description: '',
        deadline: '',
        specifications: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        paymentMethod: 'card'
    });

    const handleFilesChange = (files) => {
        setFormData({ ...formData, files });
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        setStep(step + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const prevStep = () => {
        setStep(step - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Order submitted:', formData);
        navigate('/confirmation', { state: { orderData: formData } });
    };

    return (
        <div className="upload-page">
            <div className="container">
                <div className="upload-header">
                    <h1>Start Your Project</h1>
                    <div className="progress-bar">
                        <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                            <div className="step-number">1</div>
                            <div className="step-label">Upload</div>
                        </div>
                        <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
                        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                            <div className="step-number">2</div>
                            <div className="step-label">Details</div>
                        </div>
                        <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
                        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                            <div className="step-number">3</div>
                            <div className="step-label">Address</div>
                        </div>
                        <div className={`progress-line ${step >= 4 ? 'active' : ''}`}></div>
                        <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>
                            <div className="step-number">4</div>
                            <div className="step-label">Payment</div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="upload-form">
                    {/* Step 1: File Upload */}
                    {step === 1 && (
                        <div className="form-step fade-in">
                            <div className="glass-card">
                                <h2>Upload Your Files</h2>
                                <p className="step-description">
                                    Upload all files related to your project. Accepted formats: PDF, DOC, images, etc.
                                </p>
                                <FileUpload onFilesChange={handleFilesChange} />
                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={nextStep}
                                        disabled={formData.files.length === 0}
                                    >
                                        Continue →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Project Details */}
                    {step === 2 && (
                        <div className="form-step fade-in">
                            <div className="glass-card">
                                <h2>Project Details</h2>
                                <p className="step-description">
                                    Tell us more about your project requirements
                                </p>

                                <div className="form-group">
                                    <label htmlFor="projectName">Project Name</label>
                                    <input
                                        type="text"
                                        id="projectName"
                                        name="projectName"
                                        className="input"
                                        value={formData.projectName}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Business Cards, Poster Design"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        className="input textarea"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Describe what you need made..."
                                        required
                                    ></textarea>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="deadline">Deadline (Optional)</label>
                                        <input
                                            type="date"
                                            id="deadline"
                                            name="deadline"
                                            className="input"
                                            value={formData.deadline}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="specifications">Special Specifications</label>
                                        <input
                                            type="text"
                                            id="specifications"
                                            name="specifications"
                                            className="input"
                                            value={formData.specifications}
                                            onChange={handleInputChange}
                                            placeholder="Size, material, color, etc."
                                        />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={prevStep}>
                                        ← Back
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={nextStep}>
                                        Continue →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Delivery Address */}
                    {step === 3 && (
                        <div className="form-step fade-in">
                            <div className="glass-card">
                                <h2>Delivery Address</h2>
                                <p className="step-description">
                                    Where should we deliver your finished project?
                                </p>

                                <div className="form-group">
                                    <label htmlFor="name">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        className="input"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="email">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            className="input"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="phone">Phone</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            className="input"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="address">Street Address</label>
                                    <input
                                        type="text"
                                        id="address"
                                        name="address"
                                        className="input"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="city">City</label>
                                        <input
                                            type="text"
                                            id="city"
                                            name="city"
                                            className="input"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="state">State</label>
                                        <input
                                            type="text"
                                            id="state"
                                            name="state"
                                            className="input"
                                            value={formData.state}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="zip">ZIP Code</label>
                                        <input
                                            type="text"
                                            id="zip"
                                            name="zip"
                                            className="input"
                                            value={formData.zip}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={prevStep}>
                                        ← Back
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={nextStep}>
                                        Continue →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Payment */}
                    {step === 4 && (
                        <div className="form-step fade-in">
                            <div className="glass-card">
                                <h2>Payment Method</h2>
                                <p className="step-description">
                                    Choose your preferred payment method (This is a demo - no actual payment will be processed)
                                </p>

                                <div className="payment-methods">
                                    <label className={`payment-option ${formData.paymentMethod === 'card' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="card"
                                            checked={formData.paymentMethod === 'card'}
                                            onChange={handleInputChange}
                                        />
                                        <div className="payment-content">
                                            <span className="payment-icon">💳</span>
                                            <span className="payment-label">Credit/Debit Card</span>
                                        </div>
                                    </label>

                                    <label className={`payment-option ${formData.paymentMethod === 'paypal' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="paypal"
                                            checked={formData.paymentMethod === 'paypal'}
                                            onChange={handleInputChange}
                                        />
                                        <div className="payment-content">
                                            <span className="payment-icon">🅿️</span>
                                            <span className="payment-label">PayPal</span>
                                        </div>
                                    </label>

                                    <label className={`payment-option ${formData.paymentMethod === 'bank' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="bank"
                                            checked={formData.paymentMethod === 'bank'}
                                            onChange={handleInputChange}
                                        />
                                        <div className="payment-content">
                                            <span className="payment-icon">🏦</span>
                                            <span className="payment-label">Bank Transfer</span>
                                        </div>
                                    </label>
                                </div>

                                <div className="order-summary">
                                    <h3>Order Summary</h3>
                                    <div className="summary-row">
                                        <span>Project:</span>
                                        <span>{formData.projectName || 'Unnamed Project'}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Files:</span>
                                        <span>{formData.files.length} file(s)</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Delivery:</span>
                                        <span>{formData.city}, {formData.state}</span>
                                    </div>
                                    <div className="summary-row total">
                                        <span>Estimated Total:</span>
                                        <span>$49.99</span>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={prevStep}>
                                        ← Back
                                    </button>
                                    <button type="submit" className="btn btn-success">
                                        Complete Order ✓
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default Upload;
