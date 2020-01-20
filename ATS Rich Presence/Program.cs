using ATSRP.Entities;
using DiscordRPC;
using ETCarsDotNetSdk;
using ETCarsDotNetSdk.Entities;
using ETCarsDotNetSdk.Events;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace ATSRP {

    public class Program {

        private const string DISCORD_APPLICATION_ID = "529091171633594368"; // TODO: Put into a configuration file?
        private static DiscordRpcClient rpc = new DiscordRpcClient(DISCORD_APPLICATION_ID);
        private static ETCarsWrapper et = new ETCarsWrapper();

        private const string TRUCKY_MAP_API = "https://api.truckyapp.com/v2/map/ats/resolve?x={x}&y={z}";
        private static readonly TimeSpan UPDATE_RATE = TimeSpan.FromSeconds(5);
        private static DateTime timeSinceLastUpdate;
        private static bool firstRun = true;
        private static bool updating = false;

        public static void Main(string[] args) {
            et.Connect();
            Console.ReadKey();
        }

        private static void OnDataRecieved(ETCarsDataReceivedArgs args) {
            if (firstRun || DateTime.Now - timeSinceLastUpdate > UPDATE_RATE) {
                if (updating) return;
                if (firstRun) firstRun = false;

                Console.WriteLine("Updating Rich presence...");
                RichPresence presence = OnMakePresence(args.Data);

            }
        }

        // Creates a rich presence based on the data from ETCars
        private static RichPresence OnMakePresence(ETCarsData data) {
            if (data.telemetry == null) {
                return new RichPresence();
            }
            ETCarsTelemetry tel = data.telemetry;

            // Prepare Presence
            RichPresence presence = new RichPresence();
            if (true) {
                Console.WriteLine(tel.truck.worldPlacement.x);
                return presence;
            }

            // Handle Images
            if (tel.truck != null && tel.truck.worldPlacement != null) {
                ETCarsWorldPlacement placement = tel.truck.worldPlacement;
                WebClient client = new WebClient();
                try {
                    // Make Request
                    string response = client.DownloadString(TRUCKY_MAP_API.Replace("x", placement.x.ToString()).Replace("y", placement.y.ToString("y")));
                    
                    // Handle Error
                    JObject obj = JObject.Parse(response);
                    bool errored = (bool) obj.GetValue("error");
                    if (errored) throw new Exception("Response Error");

                    // Create Object & Set Assets
                    TruckyApiResponse trucky = obj.GetValue("response").ToObject<TruckyApiResponse>();
                    if (trucky.Area) {
                        presence.Assets.LargeImageKey = trucky.PointOfInterest.RealName.ToLower().Replace(" ", "_");
                        presence.Assets.LargeImageText = "In " + trucky.PointOfInterest.RealName;
                    } else {
                        presence.Assets.LargeImageKey = trucky.PointOfInterest.Country.ToLower().Replace(" ", "_");
                        presence.Assets.LargeImageText = "Roaming in " + trucky.PointOfInterest.Country;
                    }
                } catch (Exception) {
                    presence.Assets.LargeImageKey = "truck";
                    presence.Assets.LargeImageText = "Unable to Fetch Location";
                }
            }

            // Return Presence
            return presence;
        }

    }

}
