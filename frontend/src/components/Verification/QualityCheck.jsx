/**
 * QualityCheck Component
 * Form for retailers to perform quality checks on products
 */

import { useState } from 'react';
import { verificationAPI } from '../../services/api';
import './QualityCheck.css';

/**
 * QualityCheck Component
 * 
 * @param {number} productId - Product ID to perform quality check on
 * @param {string} signerAddress - Address of the retailer performing the check
 * @param {Function} onQualityCheckComplete - Callback when quality check is completed
 * 
 * Allows retailers to perform quality checks with:
 * - Quality score (0-100)
 * - Notes/observations
 * - Pass/fail indicator (score >= 50 passes)
 */
export default function QualityCheck({ productId, signerAddress, onQualityCheckComplete }) {
  const [qualityScore, setQualityScore] = useState(75);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      // Include quality score in notes so it's visible to consumers
      const notesWithScore = notes.trim() 
        ? `Quality Score: ${qualityScore}/100. ${notes.trim()}`
        : `Quality Score: ${qualityScore}/100`;

      const response = await verificationAPI.performQualityCheck({
        signerAddress,
        productId,
        qualityScore,
        notes: notesWithScore
      });

      if (response.data && response.data.success) {
        const passed = qualityScore >= 50;
        let successMessage = `Quality check ${passed ? 'passed' : 'failed'}! Score: ${qualityScore}/100`;
        
        // Check if authenticity was auto-verified
        if (response.data.autoVerified && response.data.isAuthentic) {
          successMessage += ' ✓ Product authenticity automatically verified!';
        }
        
        setSuccess(successMessage);
        
        // Reset form
        setQualityScore(75);
        setNotes('');
        
        // Call callback
        if (onQualityCheckComplete) {
          onQualityCheckComplete(productId, qualityScore, passed);
        }
      } else {
        setError(response.data?.message || 'Quality check failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to perform quality check');
    } finally {
      setIsSubmitting(false);
    }
  };

  const passed = qualityScore >= 50;

  return (
    <div className="quality-check">
      <h3>Perform Quality Check</h3>
      <form onSubmit={handleSubmit} className="quality-check-form">
        <div className="form-group">
          <label htmlFor="qualityScore">
            Quality Score: <strong>{qualityScore}/100</strong>
            <span className={`score-indicator ${passed ? 'score-pass' : 'score-fail'}`}>
              {passed ? '✓ Pass' : '✗ Fail'}
            </span>
          </label>
          <input
            type="range"
            id="qualityScore"
            min="0"
            max="100"
            value={qualityScore}
            onChange={(e) => setQualityScore(parseInt(e.target.value))}
            className="score-slider"
          />
          <div className="score-labels">
            <span>0 (Poor)</span>
            <span>50 (Minimum)</span>
            <span>100 (Excellent)</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes / Observations</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter quality check observations, defects found, condition notes, etc."
            rows="4"
            className="notes-textarea"
          />
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-submit"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Quality Check'}
        </button>
      </form>
    </div>
  );
}

