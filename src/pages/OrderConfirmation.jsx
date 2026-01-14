import { useLocation, Link } from 'react-router-dom';
import './OrderConfirmation.css';

function OrderConfirmation() {
    const location = useLocation();
    const orderData = location.state?.orderData || {};

    const trackingNumber = 'FM' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();

    return (
        <div className="confirmation-page">
            <div className="container">
                <div className="confirmation-content fade-in">
                    <div className="success-icon">✓</div>
                    <h1>Order Confirmed!</h1>
                    <p className="confirmation-message">
                        Thank you for your order. We've received your project and will assign it to a skilled file maker shortly.
                    </p>

                    <div className="tracking-info glass-card">
                        <h3>Order Details</h3>
                        <div className="info-row">
                            <span className="info-label">Tracking Number:</span>
                            <span className="info-value tracking-number">{trackingNumber}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Project:</span>
                            <span className="info-value">{orderData.projectName || 'Unnamed Project'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Files Uploaded:</span>
                            <span className="info-value">{orderData.files?.length || 0} file(s)</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Estimated Delivery:</span>
                            <span className="info-value">{estimatedDelivery}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Delivery Address:</span>
                            <span className="info-value">
                                {orderData.address}, {orderData.city}, {orderData.state} {orderData.zip}
                            </span>
                        </div>
                    </div>

                    <div className="timeline glass-card">
                        <h3>What Happens Next?</h3>
                        <div className="timeline-steps">
                            <div className="timeline-step active">
                                <div className="step-dot"></div>
                                <div className="step-content">
                                    <h4>Order Received</h4>
                                    <p>Your order has been confirmed</p>
                                </div>
                            </div>
                            <div className="timeline-step">
                                <div className="step-dot"></div>
                                <div className="step-content">
                                    <h4>Maker Assigned</h4>
                                    <p>A file maker will be assigned within 24 hours</p>
                                </div>
                            </div>
                            <div className="timeline-step">
                                <div className="step-dot"></div>
                                <div className="step-content">
                                    <h4>In Production</h4>
                                    <p>Your project is being created</p>
                                </div>
                            </div>
                            <div className="timeline-step">
                                <div className="step-dot"></div>
                                <div className="step-content">
                                    <h4>Quality Check</h4>
                                    <p>Final review before shipping</p>
                                </div>
                            </div>
                            <div className="timeline-step">
                                <div className="step-dot"></div>
                                <div className="step-content">
                                    <h4>Shipped</h4>
                                    <p>Delivered to your address</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="confirmation-actions">
                        <Link to="/orders" className="btn btn-primary">
                            Track Order
                        </Link>
                        <Link to="/" className="btn btn-secondary">
                            Back to Home
                        </Link>
                    </div>

                    <div className="email-notice">
                        <span className="email-icon">📧</span>
                        <p>A confirmation email has been sent to <strong>{orderData.email}</strong></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderConfirmation;
