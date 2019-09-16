const socket = io();

// eleements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-message-template")
  .innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoScroll = () => {
  // new message element
  const $newMessage = $messages.lastElementChild;

  // height of the new message
  const newMessageStyle = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyle.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //visible height
  const visibleHeight = $messages.offsetHeight;

  // height of messages container
  const containerHeight = $messages.scrollHeight;

  //how far i have scroll
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", chat => {
  console.log(chat);
  const html = Mustache.render(messageTemplate, {
    messageUser: chat.username,
    message: chat.text,
    createdAt: moment(chat.createdAt).format("h:mm:ss a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("sendlocation", msg => {
  console.log(msg);
  const html = Mustache.render(locationTemplate, {
    username: msg.username,
    url: msg.url,
    urlCreatedAt: moment(msg.createdAt).format("h:mm:ss a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  console.log(users);

  document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", e => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, err => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (err) {
      return console.log(err);
    }

    console.log("Message dielevered");
  });
});

$sendLocationButton.addEventListener("click", () => {
  $sendLocationButton.setAttribute("disabled", "disabled");
  if (!navigator.geolocation) {
    return alert("Geolaction is not suppurted by your browser");
  }
  navigator.geolocation.getCurrentPosition(position => {
    socket.emit(
      "sendlocation",
      {
        latitude: position.coords.latitude,
        longnitude: position.coords.longitude
      },
      () => {
        $sendLocationButton.removeAttribute("disabled");
        console.log("location shared");
      }
    );
  });
});

socket.emit("join", { username, room }, err => {
  if (err) {
    alert(err);
    location.href = "/";
  }
});
