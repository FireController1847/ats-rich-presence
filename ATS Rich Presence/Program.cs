using DiscordRPC;
using ETCarsDotNetSdk;
using ETCarsDotNetSdk.Events;
using System;
using System.Net.Sockets;
using System.Threading;

namespace ATSRP {

    public class Program {

        private const string DISCORD_APPLICATION_ID = "529091171633594368"; // TODO: Put into a configuration file?
        private static DiscordRpcClient rpc = new DiscordRpcClient(DISCORD_APPLICATION_ID);
        private static ETCarsWrapper et = new ETCarsWrapper();

        public static void Main(string[] args) {
            Console.WriteLine("Connecting to ETCars...");
            et.Connected += OnEtCarsConnected;
            et.Errored += OnEtCarsErrored;
            et.Disconnected += OnEtCarsDisconnected;
            et.Connect();

            Console.ReadKey();
        }

        public static void OnEtCarsConnected() {
            Console.WriteLine("ETCars Connected");
        }

        public static void OnEtCarsErrored(ETCarsConnectionFailedArgs args) {
            Console.WriteLine("Awaiting connection to ETCars...");
        }

        public static void OnEtCarsDisconnected() {
            Console.WriteLine("ETCars Disconnected");
        }

    }

}
