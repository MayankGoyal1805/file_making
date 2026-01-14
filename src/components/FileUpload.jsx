import { useState } from 'react';
import './FileUpload.css';

function FileUpload({ onFilesChange }) {
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        handleFiles(droppedFiles);
    };

    const handleFileInput = (e) => {
        const selectedFiles = Array.from(e.target.files);
        handleFiles(selectedFiles);
    };

    const handleFiles = (newFiles) => {
        const updatedFiles = [...files, ...newFiles];
        setFiles(updatedFiles);
        if (onFilesChange) {
            onFilesChange(updatedFiles);
        }
    };

    const removeFile = (index) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        if (onFilesChange) {
            onFilesChange(updatedFiles);
        }
    };

    return (
        <div className="file-upload-container">
            <div
                className={`file-upload-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    multiple
                    onChange={handleFileInput}
                    className="file-input"
                    id="file-input"
                />
                <label htmlFor="file-input" className="file-upload-label">
                    <div className="upload-icon">📤</div>
                    <h3>Drag & drop files here</h3>
                    <p>or click to browse</p>
                    <div className="upload-hint">Supports: PDF, DOC, TXT, Images, etc.</div>
                </label>
            </div>

            {files.length > 0 && (
                <div className="file-list">
                    <h4>Selected Files ({files.length})</h4>
                    {files.map((file, index) => (
                        <div key={index} className="file-item">
                            <div className="file-info">
                                <span className="file-icon">📄</span>
                                <div className="file-details">
                                    <div className="file-name">{file.name}</div>
                                    <div className="file-size">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </div>
                                </div>
                            </div>
                            <button
                                className="file-remove"
                                onClick={() => removeFile(index)}
                                type="button"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FileUpload;
