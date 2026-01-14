import { useState } from 'react';
import './Orders.css';

function Orders() {
    const [filter, setFilter] = useState('all');

    // Dummy orders data
    const orders = [
        {
            id: 'FM8K2L9P4',
            projectName: 'Business Cards',
            status: 'shipped',
            date: '2026-01-10',
            amount: '$75',
            maker: 'John Doe',
            estimatedDelivery: '2026-01-18'
        },
        {
            id: 'FMXP9L2K1',
            projectName: 'Poster Design',
            status: 'in-progress',
            date: '2026-01-12',
            amount: '$120',
            maker: 'Jane Smith',
            estimatedDelivery: '2026-01-20'
        },
        {
            id: 'FM3N7M4K8',
            projectName: 'Brochure Layout',
            status: 'pending',
            date: '2026-01-14',
            amount: '$90',
            maker: 'Unassigned',
            estimatedDelivery: '2026-01-22'
        },
        {
            id: 'FM1Q5W2E9',
            projectName: 'Logo Print',
            status: 'completed',
            date: '2026-01-05',
            amount: '$150',
            maker: 'Mike Johnson',
            deliveredDate: '2026-01-12'
        }
    ];

    const getStatusBadge = (status) => {
        const statusMap = {
            pending: { class: 'badge-warning', text: 'Pending' },
            'in-progress': { class: 'badge-info', text: 'In Progress' },
            shipped: { class: 'badge-info', text: 'Shipped' },
            completed: { class: 'badge-success', text: 'Completed' }
        };
        const statusInfo = statusMap[status] || { class: '', text: status };
        return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
    };

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(order => order.status === filter);

    return (
        <div className="orders-page">
            <div className="container">
                <div className="orders-header fade-in">
                    <h1>My Orders</h1>
                    <p>Track and manage all your projects</p>
                </div>

                <div className="filters">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All Orders
                    </button>
                    <button
                        className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        Pending
                    </button>
                    <button
                        className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
                        onClick={() => setFilter('in-progress')}
                    >
                        In Progress
                    </button>
                    <button
                        className={`filter-btn ${filter === 'shipped' ? 'active' : ''}`}
                        onClick={() => setFilter('shipped')}
                    >
                        Shipped
                    </button>
                    <button
                        className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilter('completed')}
                    >
                        Completed
                    </button>
                </div>

                <div className="orders-list">
                    {filteredOrders.length === 0 ? (
                        <div className="empty-state glass-card">
                            <div className="empty-icon">📦</div>
                            <h3>No orders found</h3>
                            <p>Try adjusting your filters or create a new order</p>
                        </div>
                    ) : (
                        filteredOrders.map(order => (
                            <div key={order.id} className="order-card glass-card">
                                <div className="order-header">
                                    <div className="order-title-section">
                                        <h3>{order.projectName}</h3>
                                        <div className="order-id">#{order.id}</div>
                                    </div>
                                    {getStatusBadge(order.status)}
                                </div>

                                <div className="order-details">
                                    <div className="detail-item">
                                        <span className="detail-icon">📅</span>
                                        <div>
                                            <div className="detail-label">Order Date</div>
                                            <div className="detail-value">{order.date}</div>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-icon">👤</span>
                                        <div>
                                            <div className="detail-label">Maker</div>
                                            <div className="detail-value">{order.maker}</div>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-icon">💰</span>
                                        <div>
                                            <div className="detail-label">Amount</div>
                                            <div className="detail-value">{order.amount}</div>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-icon">🚚</span>
                                        <div>
                                            <div className="detail-label">
                                                {order.status === 'completed' ? 'Delivered' : 'Estimated Delivery'}
                                            </div>
                                            <div className="detail-value">
                                                {order.deliveredDate || order.estimatedDelivery}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="order-actions">
                                    <button className="btn btn-secondary">View Details</button>
                                    {order.status === 'completed' && (
                                        <button className="btn btn-primary">Leave Review</button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default Orders;
