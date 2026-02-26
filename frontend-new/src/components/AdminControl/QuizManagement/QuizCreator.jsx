import React, { useState, useEffect } from 'react';
// 🔥 FIXED: Import path sahi kiya hai
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { 
  FaPlus, FaTrash, FaSave, FaArrowLeft, FaSpinner,
  FaCheckCircle, FaTimesCircle, FaClock, FaStar,
  FaQuestionCircle
} from 'react-icons/fa';
import './QuizManager.css';

const QuizCreator = ({ quiz, courses, onCancel, onSuccess }) => {
  const isEdit = !!quiz;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    duration: 30,
    totalMarks: 100,
    passingMarks: 50,
    status: 'draft',
    questions: []
  });
  
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    questionType: 'mcq',
    options: ['', '', '', ''],
    correctOption: 0,
    marks: 10,
    explanation: ''
  });

  const toastStyle = {
    border: '1px solid #000B29',
    padding: '16px',
    color: '#000B29',
    background: '#ffffff',
    borderRadius: '8px'
  };

  useEffect(() => {
    if (isEdit && quiz) {
      setFormData({
        title: quiz.title || '',
        description: quiz.description || '',
        courseId: quiz.courseId?._id || quiz.courseId || '',
        duration: quiz.duration || 30,
        totalMarks: quiz.totalMarks || 100,
        passingMarks: quiz.passingMarks || 50,
        status: quiz.status || 'draft',
        questions: quiz.questions || []
      });
    }
  }, [isEdit, quiz]);

  const handleAddQuestion = () => {
    if (!currentQuestion.questionText.trim()) {
      toast.error('Please enter question text', { style: toastStyle });
      return;
    }
    
    const filledOptions = currentQuestion.options.map(opt => opt.trim()).filter(opt => opt);
    if (filledOptions.length < 2) {
      toast.error('Please fill at least 2 options', { style: toastStyle });
      return;
    }

    const finalOptions = currentQuestion.options.map(opt => opt.trim() || 'Option');

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { 
        ...currentQuestion, 
        options: finalOptions,
        id: Date.now() 
      }]
    }));

    setCurrentQuestion({
      questionText: '',
      questionType: 'mcq',
      options: ['', '', '', ''],
      correctOption: 0,
      marks: 10,
      explanation: ''
    });

    toast.success('Question added!', { style: toastStyle });
  };

  const handleRemoveQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter quiz title', { style: toastStyle });
      return;
    }

    if (!formData.courseId) {
      toast.error('Please select a course', { style: toastStyle });
      return;
    }

    if (formData.questions.length === 0) {
      toast.error('Please add at least one question', { style: toastStyle });
      return;
    }

    const calculatedTotalMarks = formData.questions.reduce((acc, q) => acc + (q.marks || 10), 0);
    
    const finalData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      courseId: formData.courseId,
      duration: parseInt(formData.duration) || 30,
      passingMarks: parseInt(formData.passingMarks) || 50,
      status: formData.status,
      questions: formData.questions.map(q => ({
        questionText: q.questionText.trim(),
        questionType: q.questionType || 'mcq',
        options: q.options.map(opt => opt.trim()).filter(opt => opt),
        correctOption: parseInt(q.correctOption) || 0,
        marks: parseInt(q.marks) || 10,
        explanation: (q.explanation || '').trim()
      }))
    };

    console.log('🔵 Submitting quiz data:', finalData);

    setLoading(true);
    const loadId = toast.loading(isEdit ? 'Updating...' : 'Creating...', { style: toastStyle });

    try {
      let response;
      
      if (isEdit) {
        response = await adminAPI.updateQuiz(quiz._id, finalData);
      } else {
        response = await adminAPI.createQuiz(finalData);
      }

      console.log('🔵 Quiz API Response:', response.data);

      if (response.data.success) {
        toast.success(
          isEdit ? 'Quiz updated successfully!' : `Quiz created! ID: ${response.data.quiz?.quizNumber}`, 
          { id: loadId, style: toastStyle }
        );
        onSuccess();
      }
    } catch (err) {
      console.error('❌ Quiz creation error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create quiz';
      toast.error(errorMsg, { id: loadId, style: toastStyle });
    } finally {
      setLoading(false);
    }
  };

  const getCorrectOptionLabel = (index) => {
    return String.fromCharCode(65 + index);
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>
          {isEdit ? <FaCheckCircle /> : <FaPlus />}
          {isEdit ? ' Edit Quiz' : ' Create New Quiz'}
        </h2>
        <button className="btn-back" onClick={onCancel}>
          <FaArrowLeft /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="assignment-form quiz-form">
        {/* Basic Info */}
        <div className="form-grid">
          <div className="form-group">
            <label>Quiz Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Enter quiz title"
              required
            />
          </div>

          <div className="form-group">
            <label>Course *</label>
            <select
              value={formData.courseId}
              onChange={(e) => setFormData({...formData, courseId: e.target.value})}
              required
            >
              <option value="">-- Select Course --</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Duration (minutes)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
              min="1"
              max="180"
              placeholder="No limit if empty"
            />
          </div>

          <div className="form-group">
            <label>Passing Marks (%)</label>
            <input
              type="number"
              value={formData.passingMarks}
              onChange={(e) => setFormData({...formData, passingMarks: parseInt(e.target.value) || 0})}
              min="0"
              max="100"
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Enter quiz description..."
            rows="3"
          />
        </div>

        {/* Status Dropdown */}
        <div className="form-group full-width">
          <label>Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            style={{ width: '200px' }}
          >
            <option value="draft">Draft (Hidden from students)</option>
            <option value="active">Active (Visible to students)</option>
            <option value="inactive">Inactive</option>
          </select>
          <small style={{color: '#666', display: 'block', marginTop: '4px'}}>
            {formData.status === 'active' 
              ? 'Students will see this quiz immediately' 
              : 'Only you can see this quiz'}
          </small>
        </div>

        {/* Questions Section */}
        <div className="questions-section">
          <h3><FaQuestionCircle /> Questions ({formData.questions.length})</h3>
          
          {/* Add New Question */}
          <div className="add-question-box">
            <div className="form-group full-width">
              <label>Question Text *</label>
              <textarea
                value={currentQuestion.questionText}
                onChange={(e) => setCurrentQuestion({...currentQuestion, questionText: e.target.value})}
                placeholder="Enter your question here..."
                rows="2"
              />
            </div>

            <div className="options-grid">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className={`option-input ${currentQuestion.correctOption === index ? 'correct' : ''}`}>
                  <div className="option-label">{getCorrectOptionLabel(index)}</div>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${getCorrectOptionLabel(index)}`}
                  />
                  <button
                    type="button"
                    className={`mark-correct-btn ${currentQuestion.correctOption === index ? 'active' : ''}`}
                    onClick={() => setCurrentQuestion({...currentQuestion, correctOption: index})}
                    title="Mark as correct answer"
                  >
                    {currentQuestion.correctOption === index ? <FaCheckCircle /> : <FaTimesCircle />}
                  </button>
                </div>
              ))}
            </div>

            <div className="question-meta-row">
              <div className="form-group">
                <label>Marks for this question</label>
                <input
                  type="number"
                  value={currentQuestion.marks}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, marks: parseInt(e.target.value) || 10})}
                  min="1"
                  max="100"
                />
              </div>
              
              <div className="form-group" style={{ flex: 1 }}>
                <label>Explanation (optional)</label>
                <input
                  type="text"
                  value={currentQuestion.explanation}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, explanation: e.target.value})}
                  placeholder="Explain why this is the correct answer..."
                />
              </div>

              <button type="button" className="btn-add-question" onClick={handleAddQuestion}>
                <FaPlus /> Add Question
              </button>
            </div>
          </div>

          {/* Questions List */}
          {formData.questions.length > 0 && (
            <div className="questions-list">
              <h4>Added Questions</h4>
              {formData.questions.map((q, index) => (
                <div key={q.id || index} className="question-item">
                  <div className="question-header">
                    <span className="question-number">Q{index + 1}</span>
                    <span className="question-marks">{q.marks} marks</span>
                    <button 
                      type="button" 
                      className="btn-remove-question"
                      onClick={() => handleRemoveQuestion(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <p className="question-text">{q.questionText}</p>
                  <div className="options-preview">
                    {q.options.map((opt, optIndex) => (
                      <div 
                        key={optIndex} 
                        className={`option-preview ${q.correctOption === optIndex ? 'correct-answer' : ''}`}
                      >
                        <span className="option-letter">{getCorrectOptionLabel(optIndex)}</span>
                        <span className="option-text">{opt}</span>
                        {q.correctOption === optIndex && <FaCheckCircle className="correct-icon" />}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <div className="explanation-box">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading || formData.questions.length === 0}
          >
            {loading ? <FaSpinner className="spin" /> : <FaSave />}
            {isEdit ? 'Update Quiz' : 'Create Quiz'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .quiz-form {
          max-width: 900px;
        }
        
        .questions-section {
          margin: 24px 0;
          padding: 24px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .questions-section h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 20px 0;
          color: #000B29;
          font-size: 18px;
        }
        
        .add-question-box {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 2px dashed #cbd5e1;
          margin-bottom: 24px;
        }
        
        .options-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin: 16px 0;
        }
        
        .option-input {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }
        
        .option-input.correct {
          background: #dcfce7;
          border-color: #16a34a;
        }
        
        .option-label {
          width: 28px;
          height: 28px;
          background: #000B29;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }
        
        .option-input input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 8px;
          font-size: 14px;
        }
        
        .mark-correct-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: #f1f5f9;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          transition: all 0.2s;
        }
        
        .mark-correct-btn.active {
          background: #16a34a;
          color: white;
        }
        
        .mark-correct-btn:hover {
          background: #16a34a;
          color: white;
        }
        
        .question-meta-row {
          display: flex;
          gap: 16px;
          align-items: flex-end;
        }
        
        .btn-add-question {
          padding: 12px 24px;
          background: #000B29;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          height: fit-content;
        }
        
        .btn-add-question:hover {
          background: #E30613;
          transform: translateY(-1px);
        }
        
        .questions-list {
          margin-top: 24px;
        }
        
        .questions-list h4 {
          margin: 0 0 16px 0;
          color: #000B29;
          font-size: 16px;
        }
        
        .question-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
        }
        
        .question-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .question-number {
          background: #000B29;
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
        }
        
        .question-marks {
          margin-left: auto;
          color: #E30613;
          font-weight: 600;
          font-size: 13px;
        }
        
        .btn-remove-question {
          background: #fee2e2;
          color: #dc2626;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .btn-remove-question:hover {
          background: #dc2626;
          color: white;
        }
        
        .question-text {
          margin: 0 0 12px 0;
          color: #1e293b;
          font-size: 15px;
          line-height: 1.5;
        }
        
        .options-preview {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        
        .option-preview {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          background: #f8fafc;
          border-radius: 6px;
          font-size: 13px;
        }
        
        .option-preview.correct-answer {
          background: #dcfce7;
          border: 1px solid #16a34a;
        }
        
        .option-letter {
          width: 24px;
          height: 24px;
          background: #e2e8f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }
        
        .option-preview.correct-answer .option-letter {
          background: #16a34a;
          color: white;
        }
        
        .correct-icon {
          color: #16a34a;
          margin-left: auto;
        }
        
        .explanation-box {
          margin-top: 12px;
          padding: 12px;
          background: #fef3c7;
          border-radius: 6px;
          font-size: 13px;
          color: #92400e;
        }
        
        @media (max-width: 768px) {
          .options-grid,
          .options-preview {
            grid-template-columns: 1fr;
          }
          
          .question-meta-row {
            flex-direction: column;
          }
          
          .btn-add-question {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizCreator;