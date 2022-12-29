import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
let loadInterval;

function loader(element) {
  element.textContent = 'Loading';

  loadInterval = setInterval(() => {
    element.textContent += '.';
    if (element.textContent === 'Loading....') {
      element.textContent = 'Loading';
    }
  }, 300);
}

function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20);
}

function generateuniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAI, value, uniqueId) {
  return `
    <div class="wrapper ${isAI && 'ai'}">
      <div class='chat'>
        <div class='profile'>
          <img
            src='${isAI ? bot : user}'
            alt="${isAI ? 'bot' : 'user'} avatar"
          />
        </div>
        <div class="message" id="${uniqueId}">${value}</div>
      </div>
    </div>
    `;
}

//Function to save a question and response from a chatbot to local storage
function saveChatbotData(question, response) {
  //Create an object with the question and response
  const chatbotData = {
    question: question,
    response: response,
  };

  //Check if there is already data in local storage
  let existingData = localStorage.getItem('chatbotData');

  //If there is existing data, parse it into an array of objects
  if (existingData) {
    existingData = JSON.parse(existingData);

    //Push the new data into the array of objects
    existingData.push(chatbotData);

    //Stringify the array of objects and save it back to local storage
    localStorage.setItem('chatbotData', JSON.stringify(existingData));
  } else {
    //If there is no existing data, create an array with the new data and save it to local storage

    const newChatbotData = [chatbotData];

    localStorage.setItem('chatbotData', JSON.stringify(newChatbotData));
  }
}

//Function to load the saved chatbot data from local storage to the UI
function loadChatbotData() {
  //Retrieve the saved chatbot data from local storage as a stringified array of objects
  const savedChatbotData = JSON.parse(localStorage.getItem('chatbotData'));

  //Loop through each object in the array and add it to the UI
  for (let i = 0; i < savedChatbotData.length; i++) {
    const questionElement = document.createElement('p'); //Create a <p> element for each question
    questionElement.innerText = savedChatbotData[i].question; //Set its text content to be the current object's question

    const responseElement = document.createElement('p'); //Create a <p> element for each response
    responseElement.innerText = savedChatbotData[i].response; //Set its text content to be the current object's response

    document.body.appendChild(questionElement); //Append both elements to the body of the page
    document.body.appendChild(responseElement);
  }
}

function formatCode(text) {
  // Split the text into an array of lines
  let lines = text.split('\n');

  // Create a new array to store the formatted lines
  let formattedLines = [];

  // Iterate over each line in the original array
  for (let line of lines) {
    // Trim any whitespace from the beginning and end of the line
    let trimmedLine = line.trim();

    // Add two spaces to the beginning of each line
    let indentedLine = '  ' + trimmedLine;

    // Push the indented line to the new array
    formattedLines.push(indentedLine);
  }

  // Join all of the lines in the new array together with a newline character between them
  return formattedLines.join('\n');
}
const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  // user's Chat stripe
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));
  form.reset();

  // bot's ChatStripe
  const uniqueID = generateuniqueId();
  chatContainer.innerHTML += chatStripe(true, ' ', uniqueID);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueID);
  loader(messageDiv);

  //fetch response from server -> bot response
  const response = await fetch('https://codex-1ca7.onrender.com/', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: data.get('prompt'),
    }),
  });

  // clear loader
  clearInterval(loadInterval);

  messageDiv.innerHTML = '';

  if (response.ok) {
    const data = await response.json();
    const parseData = data.bot.trim();
    const text = formatCode(parseData);
    typeText(messageDiv, text);
  } else {
    const err = await response.text();

    messageDiv.innerHTML = 'Something Went Wrong!';
    alert(err);
  }
};

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    handleSubmit(e);
  }
});
