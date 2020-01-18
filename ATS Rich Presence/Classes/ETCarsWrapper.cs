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

        // Add event forwarding
        public new event ETCarsConnectionFailedEventArgs Errored;

        /// <summary>
        /// Wraps the ETCarsClient and makes it continually attempt to connect until the user specified it should stop.
        /// </summary>
        public ETCarsWrapper() : base() {
            base.Errored += OnErrored;
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

        private void OnErrored(ETCarsConnectionFailedArgs args) {
            this.Errored.Invoke(args);
            if (autoReconnect) {
                Thread.Sleep(delays[attempts < delays.Length ? attempts++ : attempts]);
                base.Connect();
            }
        }

    }
}
