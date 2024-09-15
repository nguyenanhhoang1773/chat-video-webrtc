import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors"; // Import cors
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // URL của client
    methods: ["GET", "POST"],
  },
});
app.use(cors());
// Chứa các kết nối người dùng
let connectedUsers = {};

// Serve trang HTML (giao diện của ứng dụng)
app.use(express.static("public"));

// Lắng nghe sự kiện khi có kết nối đến server
io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  // Xử lý sự kiện khi người dùng join vào phòng
  socket.on("join-room", (roomID) => {
    socket.join(roomID);
    if (!connectedUsers[roomID]) {
      connectedUsers[roomID] = [];
    }
    connectedUsers[roomID].push(socket.id);

    // Thông báo đến người dùng khác trong phòng về người mới
    socket.to(roomID).emit("user-connected", socket.id);
  });
  socket.on("send-message", (mess) => {
    console.log(mess);
  });
  // Xử lý offer từ peer này gửi sang peer khác
  socket.on("offer", (offer, roomID) => {
    socket.to(roomID).emit("offer", offer, socket.id);
  });

  // Xử lý answer từ peer này gửi sang peer khác
  socket.on("answer", (answer, roomID) => {
    socket.to(roomID).emit("answer", answer, socket.id);
  });

  // Xử lý ICE candidate để thiết lập kết nối P2P
  socket.on("ice-candidate", (candidate, roomID) => {
    socket.to(roomID).emit("ice-candidate", candidate, socket.id);
  });

  // Xử lý khi người dùng ngắt kết nối
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Xóa người dùng khỏi danh sách phòng
    for (const roomID in connectedUsers) {
      connectedUsers[roomID] = connectedUsers[roomID].filter(
        (id) => id !== socket.id
      );
      socket.to(roomID).emit("user-disconnected", socket.id);
    }
  });
});

// Lắng nghe cổng 3000
const PORT = process.env.PORT || 3333;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
