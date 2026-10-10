const express = require("express");

const app = express();

app.use(express.json());

app.post("/api/booking", (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      service,
      preferredDate,
      preferredTime,
      specialRequest
    } = req.body;

    console.log({
      firstName,
      lastName,
      phone,
      service,
      preferredDate,
      preferredTime,
      specialRequest
    });

    res.json({
      success: true,
      message: "Booking received successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
