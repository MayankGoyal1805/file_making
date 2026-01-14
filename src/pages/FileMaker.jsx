import { useState } from 'react';
import './FileMaker.css';

function FileMaker() {
    const [activeTab, setActiveTab] = useState('available');

    // Dummy job data
    const [availableJobs] = useState([
        {
            id: 1,
            title: 'Business Card Design',
            description: 'Create 100 business cards with logo and contact info',
            budget: '$75',
            deadline: '2026-01-20',
            files: 3
        },
        {
            id: 2,
            title: 'Poster Printing',
            description: 'A2 size poster for event announcement',
            budget: '$120',
            deadline: '2026-01-22',
            files: 2
        },
        {
            id: 3,
            title: 'Brochure Layout',
            description: 'Tri-fold brochure for marketing campaign',
            budget: '$90',
            deadline: '2026-01-25',
            files: 5
        }
    ]);

    const [currentJobs] = useState([
        {
            id: 101,
            title: 'Company Logo',
            description: 'Design and print company logo on canvas',
            budget: '$150',
            progress: 60,
            deadline: '2026-01-18'
        }
    ]);

    const [completedJobs] = useState([
        {
            id: 201,
            title: 'Wedding Invitations',
            description: 'Custom wedding invitation cards (50 pcs)',
            budget: '$200',
            completedDate: '2026-01-10',
            rating: 5
        },
        {
            id: 202,
            title: 'Magazine Layout',
            description: '20-page magazine design and print',
            budget: '$350',
            completedDate: '2026-01-05',
            rating: 5
        }
    ]);

    const handleAcceptJob = (jobId) => {
        console.log('Accepted job:', jobId);
        alert('Job accepted! It will appear in your "Current Jobs" tab.');
    };

    return (
        <div className="filemaker-page">
            <div className="container">
                <div className="filemaker-header fade-in">
                    <h1>File Maker Dashboard</h1>
                    <p>Browse available projects and manage your work</p>
                </div>

                <div className="stats-overview">
                    <div className="stat-box glass-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-info">
                            <div className="stat-value">$700</div>
                            <div className="stat-label">Total Earnings</div>
                        </div>
                    </div>
                    <div className="stat-box glass-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <div className="stat-value">{completedJobs.length}</div>
                            <div className="stat-label">Completed</div>
                        </div>
                    </div>
                    <div className="stat-box glass-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <div className="stat-value">{currentJobs.length}</div>
                            <div className="stat-label">In Progress</div>
                        </div>
                    </div>
                    <div className="stat-box glass-card">
                        <div className="stat-icon">⭐</div>
                        <div className="stat-info">
                            <div className="stat-value">5.0</div>
                            <div className="stat-label">Rating</div>
                        </div>
                    </div>
                </div>

                <div className="jobs-section">
                    <div className="tabs">
                        <button
                            className={`tab ${activeTab === 'available' ? 'active' : ''}`}
                            onClick={() => setActiveTab('available')}
                        >
                            Available Jobs ({availableJobs.length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'current' ? 'active' : ''}`}
                            onClick={() => setActiveTab('current')}
                        >
                            Current Jobs ({currentJobs.length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                            onClick={() => setActiveTab('completed')}
                        >
                            Completed ({completedJobs.length})
                        </button>
                    </div>

                    <div className="tab-content">
                        {/* Available Jobs */}
                        {activeTab === 'available' && (
                            <div className="jobs-grid">
                                {availableJobs.map(job => (
                                    <div key={job.id} className="job-card glass-card">
                                        <div className="job-header">
                                            <h3>{job.title}</h3>
                                            <span className="job-budget">{job.budget}</span>
                                        </div>
                                        <p className="job-description">{job.description}</p>
                                        <div className="job-meta">
                                            <div className="job-meta-item">
                                                <span className="meta-icon">📁</span>
                                                <span>{job.files} files</span>
                                            </div>
                                            <div className="job-meta-item">
                                                <span className="meta-icon">📅</span>
                                                <span>{job.deadline}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-success"
                                            onClick={() => handleAcceptJob(job.id)}
                                        >
                                            Accept Job
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Current Jobs */}
                        {activeTab === 'current' && (
                            <div className="jobs-grid">
                                {currentJobs.map(job => (
                                    <div key={job.id} className="job-card glass-card">
                                        <div className="job-header">
                                            <h3>{job.title}</h3>
                                            <span className="badge badge-warning">In Progress</span>
                                        </div>
                                        <p className="job-description">{job.description}</p>
                                        <div className="progress-container">
                                            <div className="progress-info">
                                                <span>Progress</span>
                                                <span>{job.progress}%</span>
                                            </div>
                                            <div className="progress-track">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${job.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="job-meta">
                                            <div className="job-meta-item">
                                                <span className="meta-icon">📅</span>
                                                <span>Due: {job.deadline}</span>
                                            </div>
                                            <div className="job-meta-item">
                                                <span className="meta-icon">💰</span>
                                                <span>{job.budget}</span>
                                            </div>
                                        </div>
                                        <button className="btn btn-primary">
                                            Mark as Complete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Completed Jobs */}
                        {activeTab === 'completed' && (
                            <div className="jobs-grid">
                                {completedJobs.map(job => (
                                    <div key={job.id} className="job-card glass-card">
                                        <div className="job-header">
                                            <h3>{job.title}</h3>
                                            <span className="badge badge-success">Completed</span>
                                        </div>
                                        <p className="job-description">{job.description}</p>
                                        <div className="job-meta">
                                            <div className="job-meta-item">
                                                <span className="meta-icon">✅</span>
                                                <span>{job.completedDate}</span>
                                            </div>
                                            <div className="job-meta-item">
                                                <span className="meta-icon">💰</span>
                                                <span>{job.budget}</span>
                                            </div>
                                            <div className="job-meta-item">
                                                <span className="meta-icon">⭐</span>
                                                <span>{job.rating}/5</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FileMaker;
