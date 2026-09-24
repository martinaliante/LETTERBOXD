function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    if(true){
      message.style.color = "red" ;
        message.textContent = "Invalid username or password!";
    }
}

function register() {
  const createusername = document.getElementById("create username").value;
    const createpassword = document.getElementById("create password").value;
   const repeatpassword = document.getElementById("repeat password").value;
    const message = document.getElementById("message");

  if(true){
        message.style.color = "red" ;
        message.textContent = "Try again";
    }

}


