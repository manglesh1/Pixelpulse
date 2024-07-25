using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Ports;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Threading;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Audio;
using Microsoft.Xna.Framework.Content;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Media;

public class SoundGame : Game
{
    private SpriteFont debugFont;
    private Song _backgroundMusic;
    private SoundEffect _scoreSound;
    private ContentManager _content;
   
    static string destinationIpAddress = "192.168.0.7"; // Replace with the IP address of your USR-N540 device
    static int destinationPort = 21; // Replace with the destination port number configured on your USR-N540 device
    static int sourcePort = 2317; // Source port for sending
    static string red = "fe0000";
    static string logfile = "c:\\code\\log.log";
    private SerialPort _serialPort;
    List<string> devices;
    List<string> colors = new List<string> { colorp.blue, colorp.red, colorp.green, colorp.yellow };
    int numberofDevices = 5;
    int star = 0;
    private GraphicsDeviceManager _graphics;
    private SpriteBatch _spriteBatch;
    public static class colorp
    {
        public static string red = "fe0000";
        public static string green = "00fe00";
        public static string blue = "0000fe";
        public static string yellow = "fefe00";
        public static string nocolor = "000000";


    }
    public SoundGame()
    {
        _graphics = new GraphicsDeviceManager(this);
        // Setup the content manager
        _content = new ContentManager(Services, "Content");
       
        string portName = "COM1"; // Replace with the name of your serial port (e.g., COM1)
        int baudRate = 9600; // Replace with the baud rate of your device
        Parity parity = Parity.None; // Replace with the parity setting of your device
        int dataBits = 8; // Replace with the data bits setting of your device
        StopBits stopBits = StopBits.One; // Replace with the stop bits setting of your device
        _serialPort = new SerialPort(portName, baudRate, parity, dataBits, stopBits);
      
       // _serialPort.DataReceived += new SerialDataReceivedEventHandler(DataReceivedHandler);
       
       
    }

    protected override void LoadContent()
    {
        _spriteBatch = new SpriteBatch(GraphicsDevice);
        debugFont = Content.Load<SpriteFont>("DebugFont");
        // Load background music and sound effect
        _backgroundMusic = _content.Load<Song>("background");
        _scoreSound = _content.Load<SoundEffect>("scoreSound");

        // Play background music
        MediaPlayer.Play(_backgroundMusic);
        MediaPlayer.IsRepeating = true;

        try
        {
            //   _serialPort.Open();
            numberofDevices = CountDevices();

            initiateColors();
            DataReceivedHandler(null, null);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error opening serial port: " + ex.Message);
        }
    }
    protected override void Draw(GameTime gameTime)
    {
        GraphicsDevice.Clear(Color.CornflowerBlue);

        _spriteBatch.Begin();
        _spriteBatch.DrawString(debugFont, "Debug Message", new Vector2(10, 10), Color.White);
        _spriteBatch.End();

        base.Draw(gameTime);
    }

    private void DataReceivedHandler(object sender, SerialDataReceivedEventArgs e)
    {
        try
        {
            bool ifnotAllcolormatches = false;
            // Create a new UDP client for receiving data
            using (var udpClient = new System.Net.Sockets.UdpClient(sourcePort))
            {
                // Create an endpoint to receive data
                IPEndPoint remoteEP = new IPEndPoint(IPAddress.Any, 0);

                while (!ifnotAllcolormatches)
                {
                    // Receive data from the device
                    byte[] receivedData = udpClient.Receive(ref remoteEP);
                    List<string> d = BitConverter.ToString(receivedData).Split("-").ToList();
                    d.FindAll(x => x.Equals("0A"));
                    //Console.WriteLine(BitConverter.ToString(receivedData));
                    int position = -1;
                    for (int i = 0; i < receivedData.Length; i++) // Iterate up to the second last byte
                    {
                        // Compare byte value directly
                        if (receivedData[i] == 0x0A) // Assuming you're looking for "0A0D" sequence
                        {
                            position = i - 2; // Return the index where the sequence starts
                            break;
                        }
                    }



                    Console.WriteLine(DateTime.Now.ToLongTimeString() + $" Received data from device in hexadecimal format: {BitConverter.ToString(receivedData)} {position}");
                    if (position >= 0 && position != star)
                    {
                        File.AppendAllText(logfile, $"position:{position} star color: {devices[star]} device color:{devices[position]}\n");
                        if (devices[star].ToString() != devices[position].ToString())
                        {
                            _scoreSound.Play();
                            File.AppendAllText(logfile, "ignoring color change\n");
                            continue;
                        }
                        sendData1(udpClient, colorp.nocolor, position);
                        //check if all matches
                        if (devices.FindAll(x => x == devices[star]).Count() == 1)
                            ifnotAllcolormatches = true;


                    }

                    Thread.Sleep(20);


                }

            }
            //game done lets restart it
            if (ifnotAllcolormatches)
            {
                // player.PlaySound("score", "..\\..\\..\\resources\\youwin.mp3");

                //player.PlaySound("..\\..\\..\\resources\\background.mp3");
                File.AppendAllText(logfile, "game finished\n");
                initiateColors();
                DataReceivedHandler(null, null);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error in listener thread: " + ex.StackTrace);
        }
    }

    private void PlayScoreSound()
    {
        _scoreSound.Play();
    }
    void initiateColors()
    {
        if (devices == null)
        {
            devices = new List<string>();
            for (int i = 0; i < numberofDevices; i++)
                devices.Add(colorp.nocolor);
        }
        else
        {
            for (int i = 0; i < numberofDevices; i++)
                devices[i] = colorp.nocolor;
        }  
            
        
       
        try
        {
            byte[] data = HexStringToByteArray($"ffff{string.Join("", devices.ToArray())}");
            using (var udpClient = new System.Net.Sockets.UdpClient(sourcePort))
            {
                // Send the data to the destination IP address and port
                udpClient.Send(data, data.Length, destinationIpAddress, destinationPort);
                Thread.Sleep(500);
                for (int i = 0; i < numberofDevices; i++)
                {
                    devices[i] = colorp.red;
                }
                Thread.Sleep(500);
                data = HexStringToByteArray($"ffff{string.Join("", devices.ToArray())}");

                for (int i = 0; i < numberofDevices; i++)
                {
                    devices[i] = colorp.blue;
                }
                data = HexStringToByteArray($"ffff{string.Join("", devices.ToArray())}");
                udpClient.Send(data, data.Length, destinationIpAddress, destinationPort);
                Thread.Sleep(500);
                Random random = new Random();
                for (int i = 0; i < numberofDevices; i++)
                {
                    devices[i] = colors[random.Next(0, colors.Count - 1)];
                }
                data = HexStringToByteArray($"ffff{string.Join("", devices.ToArray())}");
                udpClient.Send(data, data.Length, destinationIpAddress, destinationPort);


                Console.WriteLine($"Data sent to device from UDP source port {sourcePort} to {destinationIpAddress}:{destinationPort}: {BitConverter.ToString(data).Replace("-", "")}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.StackTrace);
        }

        Thread.Sleep(500); // Sleep for 500 milliseconds

    }


    void sendData1(UdpClient udpClient, string color, int deviceno)
    {
        devices[deviceno] = colorp.nocolor;
        byte[] data = HexStringToByteArray($"ffff{string.Join("", devices.ToArray())}");

        // Send the data to the destination IP address and port
        udpClient.Send(data, data.Length, destinationIpAddress, destinationPort);
        Console.WriteLine($"Data sent to device from UDP source port {sourcePort} to {destinationIpAddress}:{destinationPort}: {BitConverter.ToString(data).Replace("-", "")}");

    }
    
    int CountDevices()
    {

        using (var udpClient = new System.Net.Sockets.UdpClient(sourcePort))
        {
            // Create an endpoint to receive data
            IPEndPoint remoteEP = new IPEndPoint(IPAddress.Any, 0);
            // Receive data from the device
            byte[] receivedData = udpClient.Receive(ref remoteEP);
            return receivedData[1];
        }
    }

    byte[] HexStringToByteArray(string hex)
    {
        hex = hex.Replace(" ", ""); // Remove any spaces
        byte[] bytes = new byte[hex.Length / 2];
        for (int i = 0; i < bytes.Length; i++)
        {
            bytes[i] = Convert.ToByte(hex.Substring(i * 2, 2), 16);
        }
        return bytes;
    }

    protected override void Update(GameTime gameTime)
    {
        // Game logic can go here if needed
        base.Update(gameTime);
    }

    protected override void UnloadContent()
    {
        // Clean up the serial port
        if (_serialPort != null && _serialPort.IsOpen)
        {
            _serialPort.Close();
            _serialPort.Dispose();
        }
    }

   
}
