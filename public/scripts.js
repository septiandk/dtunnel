
async function connectButton() {
    const user = document.getElementById('userName').value;
    const host = document.getElementById('hostName').value;
    if (!host && !user) {
      alert('Please enter user & host.');
      return;
    }
    try {
      
      console.log("processing connection");
      const response = await fetch('/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user, host }),
      });
  
      const data = await response.json();
      console.log(data);
      // Update UI or perform additional actions based on the response
    } catch (error) {
      console.error('Error connect:', error);
    }
  }

