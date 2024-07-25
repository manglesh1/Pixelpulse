document.getElementById('registration-form').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const playerData = {
      FirstName: document.getElementById('firstname').value,
      LastName: document.getElementById('lastname').value,
      email: document.getElementById('email').value,
    };
  
    try {
      const response = await fetch('http://localhost:3000/api/player/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const responseData = await response.json();
      console.log('Player registered:', responseData);
  
      // Hide the form and show the confirmation message
      document.getElementById('form-container').style.display = 'none';
      document.getElementById('confirmation-container').style.display = 'block';
  
      // Notify the main process or user
      window.api.send('registration-success', responseData);
    } catch (error) {
      console.error('Error registering player:', error);
      window.api.send('registration-error', error.message);
    }
  });
  
  // Handle the back button click event
  document.getElementById('back-button').addEventListener('click', () => {
    document.getElementById('form-container').style.display = 'block';
    document.getElementById('confirmation-container').style.display = 'none';
    document.getElementById('registration-form').reset();
  });
  