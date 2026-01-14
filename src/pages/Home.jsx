import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content fade-in">
                        <h1>Bring Your Projects to Life</h1>
                        <p className="hero-subtitle">
                            Upload your designs, get them professionally made, and delivered to your doorstep.
                            We connect you with skilled file makers who turn your digital files into physical reality.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/upload" className="btn btn-primary">
                                Get Started →
                            </Link>
                            <Link to="/filemaker" className="btn btn-secondary">
                                Become a Maker
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <h2 className="section-title">How It Works</h2>
                    <div className="grid grid-3">
                        <div className="feature-card glass-card">
                            <div className="feature-icon">📤</div>
                            <h3>1. Upload</h3>
                            <p>Upload your project files, documents, or designs with detailed requirements.</p>
                        </div>
                        <div className="feature-card glass-card">
                            <div className="feature-icon">⚙️</div>
                            <h3>2. Create</h3>
                            <p>Our skilled makers review and create your files with precision and care.</p>
                        </div>
                        <div className="feature-card glass-card">
                            <div className="feature-icon">🚚</div>
                            <h3>3. Deliver</h3>
                            <p>Receive your finished products delivered right to your doorstep via post.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Two Sides Section */}
            <section className="two-sides">
                <div className="container">
                    <div className="grid grid-2">
                        {/* For Customers */}
                        <div className="side-card glass-card">
                            <div className="side-header">
                                <div className="side-icon">👥</div>
                                <h3>For Customers</h3>
                            </div>
                            <ul className="side-features">
                                <li>✓ Easy file upload process</li>
                                <li>✓ Professional quality work</li>
                                <li>✓ Secure payment system</li>
                                <li>✓ Track your order status</li>
                                <li>✓ Physical delivery to your address</li>
                            </ul>
                            <Link to="/upload" className="btn btn-primary" style={{ marginTop: 'auto' }}>
                                Start Your Project
                            </Link>
                        </div>

                        {/* For File Makers */}
                        <div className="side-card glass-card">
                            <div className="side-header">
                                <div className="side-icon">🛠️</div>
                                <h3>For File Makers</h3>
                            </div>
                            <ul className="side-features">
                                <li>✓ Browse available projects</li>
                                <li>✓ Set your own rates</li>
                                <li>✓ Flexible work schedule</li>
                                <li>✓ Earn from your skills</li>
                                <li>✓ Build your portfolio</li>
                            </ul>
                            <Link to="/filemaker" className="btn btn-success" style={{ marginTop: 'auto' }}>
                                Join as Maker
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats">
                <div className="container">
                    <div className="grid grid-3">
                        <div className="stat-card">
                            <div className="stat-number">500+</div>
                            <div className="stat-label">Projects Completed</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">200+</div>
                            <div className="stat-label">Active Makers</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">98%</div>
                            <div className="stat-label">Customer Satisfaction</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;
