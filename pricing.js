document.addEventListener("DOMContentLoaded", function () {

    const categorySelect = document.getElementById("categorySelect");
    const difficultySelect = document.getElementById("difficultySelect");
    const hoursSelect = document.getElementById("taskHours");

    const marketPrice = document.getElementById("marketPrice");
    const labourPrice = document.getElementById("labourPrice");
    const suggestedPrice = document.getElementById("suggestedPrice");


    /* ================================
       CATEGORY PRICES
    ================================= */

    const pricing = {

        "Assignment Help": {
            marketMin: 150,
            marketMax: 350,
            labour: 100
        },

        "Research Assistant": {
            marketMin: 300,
            marketMax: 800,
            labour: 250
        },

        "PPT Design": {
            marketMin: 200,
            marketMax: 600,
            labour: 150
        },

        "Online Tutoring": {
            marketMin: 150,
            marketMax: 500,
            labour: 120
        },

        "Resume & CV Writing": {
            marketMin: 150,
            marketMax: 500,
            labour: 100
        },

        "Graphic Design": {
            marketMin: 250,
            marketMax: 800,
            labour: 180
        },

        "Logo Design": {
            marketMin: 250,
            marketMax: 800,
            labour: 180
        },

        "Video Editing": {
            marketMin: 300,
            marketMax: 1000,
            labour: 250
        },

        "Translation": {
            marketMin: 150,
            marketMax: 500,
            labour: 100
        },

        "Data Entry": {
            marketMin: 100,
            marketMax: 350,
            labour: 80
        },

        "Web Development": {
            marketMin: 500,
            marketMax: 1500,
            labour: 400
        },

        "App Development": {
            marketMin: 800,
            marketMax: 2500,
            labour: 600
        },

        "Content Writing": {
            marketMin: 150,
            marketMax: 600,
            labour: 100
        },

        "AI & Automation": {
            marketMin: 300,
            marketMax: 1500,
            labour: 250
        }

    };


    /* ================================
       UPDATE PRICING
    ================================= */

    function updatePricing() {

        const category = categorySelect.value;

        if (!category || !pricing[category]) {

            marketPrice.textContent = "Select a category";
            labourPrice.textContent = "Select a category";
            suggestedPrice.textContent = "Select a category";

            return;
        }


        let marketMin = pricing[category].marketMin;
        let marketMax = pricing[category].marketMax;
        let labour = pricing[category].labour;


        /* ================================
           DIFFICULTY
        ================================= */

        const difficulty = difficultySelect.value;


        if (difficulty === "Medium") {

            marketMin *= 1.25;
            marketMax *= 1.25;
            labour *= 1.20;

        }


        if (difficulty === "Hard") {

            marketMin *= 1.50;
            marketMax *= 1.50;
            labour *= 1.50;

        }


        if (difficulty === "Expert") {

            marketMin *= 1.75;
            marketMax *= 1.75;
            labour *= 1.75;

        }


        /* ================================
           ESTIMATED TIME
        ================================= */

        const time = hoursSelect.value;


        const timeMultiplier = {

            "30 Minutes": 1,
            "1 Hour": 1,
            "2 Hours": 1.5,
            "4 Hours": 2,
            "8 Hours": 3,
            "12+ Hours": 4

        };


        const multiplier =
            timeMultiplier[time] || 1;


        marketMin *= multiplier;
        marketMax *= multiplier;
        labour *= multiplier;


        /* ================================
           ROUND VALUES
        ================================= */

        marketMin = Math.round(marketMin);
        marketMax = Math.round(marketMax);
        labour = Math.round(labour);


        /* ================================
           SUGGESTED PRICE

           Affordable starting price
        ================================= */

        let suggested =
            ((marketMin + marketMax) / 2) * 0.70;


        suggested =
            Math.max(suggested, labour);


        suggested =
            Math.round(suggested);


        /* ================================
           SHOW PRICES
        ================================= */

        marketPrice.textContent =
            "₹" +
            marketMin.toLocaleString("en-IN") +
            " – ₹" +
            marketMax.toLocaleString("en-IN");


        labourPrice.textContent =
            "₹" +
            labour.toLocaleString("en-IN");


        suggestedPrice.textContent =
            "₹" +
            suggested.toLocaleString("en-IN");

    }


    /* ================================
       EVENTS
    ================================= */

    categorySelect.addEventListener(
        "change",
        updatePricing
    );


    difficultySelect.addEventListener(
        "change",
        updatePricing
    );


    hoursSelect.addEventListener(
        "change",
        updatePricing
    );


    /* Initial */

    updatePricing();

});