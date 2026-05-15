export default async function handler(req, res) {
  const { city } = req.query;

  // Validasi input
  if (!city) {
    return res.status(400).json({ error: { message: 'Parameter kota tidak boleh kosong.' } });
  }

  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${encodeURIComponent(city)}&lang=id`
    );

    const data = await response.json();
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: { message: 'Gagal mengambil data cuaca.' } });
  }
}
