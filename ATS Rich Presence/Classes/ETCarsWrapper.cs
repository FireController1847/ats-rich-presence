using ETCarsDotNetSdk;
using ETCarsDotNetSdk.Events;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;

namespace ATSRP {
    public class ETCarsWrapper : ETCarsClient {

        private readonly int[] delays = {
            1000, 2000, 5000, 10000, 30000
        };
        private bool autoReconnect = true;
        private int attempts = 0;

        /// <summary>
        /// Wraps the ETCarsClient and makes it continually attempt to connect until the user specified it should stop.
        /// </summary>
        public ETCarsWrapper() : base() {
            Connected += OnConnect;
            Errored += OnError;
            Disconnected += OnDisconnect;
        }

        /// <summary>
        /// Logs to the console that ETCars is now connecting and then connects.
        /// </summary>
        /// <param name="host"></param>
        /// <param name="port"></param>
        public new void Connect(string host = "localhost", int port = 30001) {
            Console.WriteLine("Connecting to ETCars...");
            base.Connect(host, port);
        }

        /// <summary>
        /// Enables automatically reconnecting to the API.
        /// </summary>
        public void EnableAutoReconnect() {
            autoReconnect = true;
        }

        /// <summary>
        /// Disabled automatically reconnecting to the API.
        /// </summary>
        public void DisableAutoReconnect() {
            autoReconnect = false;
        }

        private void OnConnect() {
            Console.WriteLine("ETCars Connected");
            attempts = 0;
        }

        private void OnError(ETCarsConnectionFailedArgs args) {
            Console.Write("No connection found.");
            if (autoReconnect) {
                int reconnect = delays[attempts < delays.Length ? attempts++ : attempts];
                Console.Write(" Reconnecting in " + reconnect / 1000 + " seconds...");
                Thread.Sleep(reconnect);
                Console.WriteLine();
                Connect();
                return;
            }
            Console.WriteLine();
        }

        private void OnDisconnect() {
            Console.WriteLine("ETCars Disconnected");
        }

    }
}
