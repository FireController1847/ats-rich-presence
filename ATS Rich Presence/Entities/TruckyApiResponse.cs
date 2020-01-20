using Newtonsoft.Json;

namespace ATSRP.Entities {

    public class TruckyApiResponse {

        /// <summary>
        /// Distance location (calculated in game coordinates)
        /// </summary>
        [JsonProperty("distance")]
        public double Distance { get; set; }

        /// <summary>
        /// Denotes if location has been resolved correctly
        /// </summary>
        [JsonProperty("resolved")]
        public bool Resolved { get; set; }

        /// <summary>
        /// Denotes if the player is inside a city area or near to
        /// </summary>
        [JsonProperty("area")]
        public bool Area { get; set; }

        /// <summary>
        /// Details about a location nearby the player
        /// </summary>
        [JsonProperty("poi")]
        public TruckyApiPointOfInterest PointOfInterest { get; set; }
    }

    public class TruckyApiPointOfInterest {

        /// <summary>
        /// The name of this point of interest
        /// </summary>
        [JsonProperty("realName")]
        public string RealName { get; set; }

        /// <summary>
        /// Game code (ets2 or ats)
        /// </summary>
        [JsonProperty("game")]
        public string Game { get; set; }

        /// <summary>
        /// The type of this point of interest<br/>
        /// Ex. 'city'
        /// </summary>
        [JsonProperty("type")]
        public string Type { get; set; }

        /// <summary>
        /// What country (or state) this point of interest is in
        /// </summary>
        [JsonProperty("country")]
        public string Country { get; set; }

        /// <summary>
        /// The DLC required for this point of itnerest
        /// </summary>
        [JsonProperty("dlc")]
        public string Dlc { get; set; }

        /// <summary>
        /// 
        /// </summary>
        [JsonProperty("mod")]
        public string Mod { get; set; }

    }

}