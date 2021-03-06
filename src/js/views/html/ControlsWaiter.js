/* globals moment */

/**
 * Waiter to handle events related to the CyberChef controls (i.e. Bake, Step, Save, Load etc.)
 *
 * @author n1474335 [n1474335@gmail.com]
 * @copyright Crown Copyright 2016
 * @license Apache-2.0
 *
 * @constructor
 * @param {HTMLApp} app - The main view object for CyberChef.
 * @param {Manager} manager - The CyberChef event manager.
 */
var ControlsWaiter = function(app, manager) {
    this.app = app;
    this.manager = manager;
};


/**
 * Adjusts the display properties of the control buttons so that they fit within the current width
 * without wrapping or overflowing.
 */
ControlsWaiter.prototype.adjustWidth = function() {
    var controls     = document.getElementById("controls"),
        step         = document.getElementById("step"),
        clrBreaks    = document.getElementById("clr-breaks"),
        saveImg      = document.querySelector("#save img"),
        loadImg      = document.querySelector("#load img"),
        stepImg      = document.querySelector("#step img"),
        clrRecipImg  = document.querySelector("#clr-recipe img"),
        clrBreaksImg = document.querySelector("#clr-breaks img");

    if (controls.clientWidth < 470) {
        step.childNodes[1].nodeValue = " Step";
    } else {
        step.childNodes[1].nodeValue = " Step through";
    }

    if (controls.clientWidth < 400) {
        saveImg.style.display = "none";
        loadImg.style.display = "none";
        stepImg.style.display = "none";
        clrRecipImg.style.display = "none";
        clrBreaksImg.style.display = "none";
    } else {
        saveImg.style.display = "inline";
        loadImg.style.display = "inline";
        stepImg.style.display = "inline";
        clrRecipImg.style.display = "inline";
        clrBreaksImg.style.display = "inline";
    }

    if (controls.clientWidth < 330) {
        clrBreaks.childNodes[1].nodeValue = " Clear breaks";
    } else {
        clrBreaks.childNodes[1].nodeValue = " Clear breakpoints";
    }
};


/**
 * Checks or unchecks the Auto Bake checkbox based on the given value.
 *
 * @param {boolean} value - The new value for Auto Bake.
 */
ControlsWaiter.prototype.setAutoBake = function(value) {
    var autoBakeCheckbox = document.getElementById("auto-bake");

    if (autoBakeCheckbox.checked !== value) {
        autoBakeCheckbox.click();
    }
};


/**
 * Handler to trigger baking.
 */
ControlsWaiter.prototype.bakeClick = function() {
    this.app.bake();
    $("#output-text").selectRange(0);
};


/**
 * Handler for the 'Step through' command. Executes the next step of the recipe.
 */
ControlsWaiter.prototype.stepClick = function() {
    this.app.bake(true);
    $("#output-text").selectRange(0);
};


/**
 * Handler for changes made to the Auto Bake checkbox.
 */
ControlsWaiter.prototype.autoBakeChange = function() {
    var autoBakeLabel    = document.getElementById("auto-bake-label"),
        autoBakeCheckbox = document.getElementById("auto-bake");

    this.app.autoBake_ = autoBakeCheckbox.checked;

    if (autoBakeCheckbox.checked) {
        autoBakeLabel.classList.remove("btn-default");
        autoBakeLabel.classList.add("btn-success");
    } else {
        autoBakeLabel.classList.remove("btn-success");
        autoBakeLabel.classList.add("btn-default");
    }
};


/**
 * Handler for the 'Clear recipe' command. Removes all operations from the recipe.
 */
ControlsWaiter.prototype.clearRecipeClick = function() {
    this.manager.recipe.clearRecipe();
};


/**
 * Handler for the 'Clear breakpoints' command. Removes all breakpoints from operations in the
 * recipe.
 */
ControlsWaiter.prototype.clearBreaksClick = function() {
    var bps = document.querySelectorAll("#rec-list li.operation .breakpoint");

    for (var i = 0; i < bps.length; i++) {
        bps[i].setAttribute("break", "false");
        bps[i].classList.remove("breakpoint-selected");
    }
};


/**
 * Populates the save disalog box with a URL incorporating the recipe and input.
 *
 * @param {Object[]} [recipeConfig] - The recipe configuration object array.
 */
ControlsWaiter.prototype.initialiseSaveLink = function(recipeConfig) {
    recipeConfig = recipeConfig || this.app.getRecipeConfig();

    var includeRecipe = document.getElementById("save-link-recipe-checkbox").checked,
        includeInput = document.getElementById("save-link-input-checkbox").checked,
        saveLinkEl = document.getElementById("save-link"),
        saveLink = this.generateStateUrl(includeRecipe, includeInput, recipeConfig);

    saveLinkEl.innerHTML = Utils.truncate(saveLink, 120);
    saveLinkEl.setAttribute("href", saveLink);
};


/**
 * Generates a URL containing the current recipe and input state.
 *
 * @param {boolean} includeRecipe - Whether to include the recipe in the URL.
 * @param {boolean} includeInput - Whether to include the input in the URL.
 * @param {Object[]} [recipeConfig] - The recipe configuration object array.
 * @param {string} [baseURL] - The CyberChef URL, set to the current URL if not included
 * @returns {string}
 */
ControlsWaiter.prototype.generateStateUrl = function(includeRecipe, includeInput, recipeConfig, baseURL) {
    recipeConfig = recipeConfig || this.app.getRecipeConfig();

    var link = baseURL || window.location.protocol + "//" +
                window.location.host +
                window.location.pathname,
        recipeStr = JSON.stringify(recipeConfig),
        inputStr = Utils.toBase64(this.app.getInput(), "A-Za-z0-9+/"); // B64 alphabet with no padding

    includeRecipe = includeRecipe && (recipeConfig.length > 0);
    includeInput = includeInput && (inputStr.length > 0) && (inputStr.length < 8000);

    if (includeRecipe) {
        link += "?recipe=" + encodeURIComponent(recipeStr);
    }

    if (includeRecipe && includeInput) {
        link += "&input=" + encodeURIComponent(inputStr);
    } else if (includeInput) {
        link += "?input=" + encodeURIComponent(inputStr);
    }

    return link;
};


/**
 * Handler for changes made to the save dialog text area. Re-initialises the save link.
 */
ControlsWaiter.prototype.saveTextChange = function() {
    try {
        var recipeConfig = JSON.parse(document.getElementById("save-text").value);
        this.initialiseSaveLink(recipeConfig);
    } catch (err) {}
};


/**
 * Handler for the 'Save' command. Pops up the save dialog box.
 */
ControlsWaiter.prototype.saveClick = function() {
    var recipeConfig = this.app.getRecipeConfig(),
        recipeStr = JSON.stringify(recipeConfig).replace(/},{/g, "},\n{");

    document.getElementById("save-text").value = recipeStr;

    this.initialiseSaveLink(recipeConfig);
    $("#save-modal").modal();
};


/**
 * Handler for the save link recipe checkbox change event.
 */
ControlsWaiter.prototype.slrCheckChange = function() {
    this.initialiseSaveLink();
};


/**
 * Handler for the save link input checkbox change event.
 */
ControlsWaiter.prototype.sliCheckChange = function() {
    this.initialiseSaveLink();
};


/**
 * Handler for the 'Load' command. Pops up the load dialog box.
 */
ControlsWaiter.prototype.loadClick = function() {
    this.populateLoadRecipesList();
    $("#load-modal").modal();
};


/**
 * Saves the recipe specified in the save textarea to local storage.
 */
ControlsWaiter.prototype.saveButtonClick = function() {
    var recipeName = document.getElementById("save-name").value,
        recipeStr  = document.getElementById("save-text").value;

    if (!recipeName) {
        this.app.alert("Please enter a recipe name", "danger", 2000);
        return;
    }

    var savedRecipes = localStorage.savedRecipes ?
            JSON.parse(localStorage.savedRecipes) : [],
        recipeId = localStorage.recipeId || 0;

    savedRecipes.push({
        id: ++recipeId,
        name: recipeName,
        recipe: recipeStr
    });

    localStorage.savedRecipes = JSON.stringify(savedRecipes);
    localStorage.recipeId = recipeId;

    this.app.alert("Recipe saved as \"" + recipeName + "\".", "success", 2000);
};


/**
 * Populates the list of saved recipes in the load dialog box from local storage.
 */
ControlsWaiter.prototype.populateLoadRecipesList = function() {
    var loadNameEl = document.getElementById("load-name");

    // Remove current recipes from select
    var i = loadNameEl.options.length;
    while (i--) {
        loadNameEl.remove(i);
    }

    // Add recipes to select
    var savedRecipes = localStorage.savedRecipes ?
            JSON.parse(localStorage.savedRecipes) : [];

    for (i = 0; i < savedRecipes.length; i++) {
        var opt = document.createElement("option");
        opt.value = savedRecipes[i].id;
        opt.innerHTML = savedRecipes[i].name;

        loadNameEl.appendChild(opt);
    }

    // Populate textarea with first recipe
    document.getElementById("load-text").value = savedRecipes.length ? savedRecipes[0].recipe : "";
};


/**
 * Removes the currently selected recipe from local storage.
 */
ControlsWaiter.prototype.loadDeleteClick = function() {
    var id = parseInt(document.getElementById("load-name").value, 10),
        savedRecipes = localStorage.savedRecipes ?
            JSON.parse(localStorage.savedRecipes) : [];

    savedRecipes = savedRecipes.filter(function(r) {
        return r.id !== id;
    });

    localStorage.savedRecipes = JSON.stringify(savedRecipes);
    this.populateLoadRecipesList();
};


/**
 * Displays the selected recipe in the load text box.
 */
ControlsWaiter.prototype.loadNameChange = function(e) {
    var el = e.target,
        savedRecipes = localStorage.savedRecipes ?
            JSON.parse(localStorage.savedRecipes) : [],
        id = parseInt(el.value, 10);

    var recipe = savedRecipes.filter(function(r) {
        return r.id === id;
    })[0];

    document.getElementById("load-text").value = recipe.recipe;
};


/**
 * Loads the selected recipe and populates the Recipe with its operations.
 */
ControlsWaiter.prototype.loadButtonClick = function() {
    try {
        var recipeConfig = JSON.parse(document.getElementById("load-text").value);
        this.app.setRecipeConfig(recipeConfig);

        $("#rec-list [data-toggle=popover]").popover();
    } catch (e) {
        this.app.alert("Invalid recipe", "danger", 2000);
    }
};


/**
 * Populates the bug report information box with useful technical info.
 */
ControlsWaiter.prototype.supportButtonClick = function() {
    var reportBugInfo = document.getElementById("report-bug-info"),
        saveLink = this.generateStateUrl(true, true, null, "https://gchq.github.io/CyberChef/");

    reportBugInfo.innerHTML = "* CyberChef compile time: <%= compileTime %>\n" +
        "* User-Agent: \n" + navigator.userAgent + "\n" +
        "* [Link to reproduce](" + saveLink + ")\n\n";
};
