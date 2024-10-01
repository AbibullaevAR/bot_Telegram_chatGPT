const BASE_URL = process.env.BASE_URL;


async function sendMessagesToGPT(options){
  const { id, messages } = options;

  const url = `${BASE_URL}/api/dialog/send-messages`

  try{
    const response = await fetch(url,{
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages,
        id: id
      })
    });

    return await response.json();
  }catch(erorr){
    console.log(erorr);
    return null;
  }
}

async function getAnswer(dialogId) {
  const url = `${BASE_URL}/api/assistant/answer`

  try{
    const response = await fetch(url,{
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: dialogId
      })
    });

    return await response.json();
  }catch(erorr){
    console.log(erorr);
    return null;
  }
}

module.exports = {sendMessagesToGPT, getAnswer}
