import React from 'react';

const Signup = () => {
  return (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <h2>Join <span style={{ color: '#E30613' }}>SkillsMind</span></h2>
      <form style={{ display: 'inline-block', textAlign: 'left' }}>
        <input type="text" placeholder="Full Name" style={inputStyle} /><br/>
        <input type="email" placeholder="Email" style={inputStyle} /><br/>
        <input type="password" placeholder="Password" style={inputStyle} /><br/>
        <button style={{ background: '#000B29', color: 'white', padding: '10px 20px', width: '100%' }}>Register</button>
      </form>
    </div>
  );
};

const inputStyle = { width: '300px', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' };

export default Signup;