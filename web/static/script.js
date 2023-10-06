const socket = io.connect('http://localhost:5001');

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

let aiMessage;
let current_message_type = "";
let new_paragraph = true;
let current_code_language = "";

socket.on('receive_message', (data) => {
  if (!aiMessage) {
    aiMessage = document.createElement('div');
  }
  console.log(data);

  add_child = new_paragraph || current_message_type !== data.type;

  // process message
  if (data.type === 'message') {
    if (add_child) {
      const text = document.createElement('p');
      aiMessage.appendChild(text);
      new_paragraph = false;
    }
    if (data.content === '\n') {
      new_paragraph = true;
    }else{
      aiMessage.lastChild.textContent += data.content;
    }
    
    current_message_type = 'message';
  } else if (data.type === 'code') {
    if (add_child) {
      const div = document.createElement('div');
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.classList.add('highlighted-code');
      pre.appendChild(code);
      div.appendChild(pre);
      aiMessage.appendChild(div);
      new_paragraph = false;
    }
    last_child = aiMessage.lastChild;
    code = last_child.firstChild.firstChild;
    code.textContent += data.content;
    hljs.highlightBlock(code, { language: current_code_language });
    current_message_type = 'code';
  } else if (data.type === 'image') {
    const img = document.createElement('img');
    img.src = data.content;
    img.alt = 'AI Response Image';
    aiMessage.appendChild(img);
  } else if (data.type === 'language') {
    current_code_language = data.content;
  } else if (data.type === "executing"){
    const executing = document.createElement('div');
    executing.textContent = "Executing...";
    executing.classList.add('executing');
    const loading_icon = document.createElement('i');
    loading_icon.classList.add('fa');
    loading_icon.classList.add('fa-spinner');
    loading_icon.classList.add('fa-spin');
    executing.appendChild(loading_icon);
    aiMessage.appendChild(executing);
    current_message_type = "executing";
  } else if (data.type === "output"){
    if (current_message_type === 'executing' ) {
      //remove the executing message
      aiMessage.removeChild(aiMessage.lastChild);
    }
    if (add_child) {
      const output = document.createElement('div');
      const output_title = document.createElement('h3');
      output_title.textContent = "Output:";
      output.appendChild(output_title);
      output_text_span = document.createElement('span');
      output_text_span.textContent = data.content;
      output.appendChild(output_text_span);
      output.classList.add('execute-output');
      aiMessage.appendChild(output);
      current_message_type = 'output';
      
    }else{
      br = document.createElement('br');
      output_text_span = document.createElement('span');
      output_text_span.textContent = data.content;
      aiMessage.lastChild.appendChild(br);
      aiMessage.lastChild.appendChild(output_text_span);
    }
    // const output = document.createElement('div');
    // const output_title = document.createElement('h3');
    // output_title.textContent = "Output:";
    // output.appendChild(output_title);
    // output_text_span = document.createElement('span');
    // output_text_span.textContent = data.content;
    // output.appendChild(output_text_span);
    // output.classList.add('execute-output');
    // aiMessage.appendChild(output);
  } else {
    console.log('Unknown message type: ' + data.type);
  }

  aiMessage.classList.add('ai-message');  // Add class for styling
  
  // Append message only if it's not already in the chat
  if (!aiMessage.parentElement) {
    document.getElementById('messages').appendChild(aiMessage);
  }
});

socket.on('end_signal', () => {
  // Enable the input again upon receiving end signal
  document.getElementById('input').disabled = false;
  // Reset aiMessage to create new element for next set of responses
  aiMessage = null;
  current_message_type = "";
  new_paragraph = true;
});

function sendMessage() {
  const input = document.getElementById('input');
  if (input.value.trim() !== '') {
    const userMessage = document.createElement('div');
    userMessage.textContent = input.value;
    userMessage.classList.add('user-message');  // Add class for styling
    document.getElementById('messages').appendChild(userMessage);

    // Disable input until end signal is received
    input.disabled = true;

    // Send message to server
    socket.emit('send_message', { message: input.value });
    input.value = '';
  }
}

// Select the textarea element
const input = document.getElementById('input');

// Function to adjust the height of the textarea
function adjustTextareaHeight() {
  input.style.height = 'auto';  // Reset height to auto
  input.style.height = (input.scrollHeight) + 'px';  // Set height to scrollHeight
}

// Add input event listener to adjust height on user input
input.addEventListener('input', adjustTextareaHeight);

// Call the function initially to set the height based on the initial content
adjustTextareaHeight();


input.addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();  // Prevent new line being created
    sendMessage();  // Send the message
  }
});

