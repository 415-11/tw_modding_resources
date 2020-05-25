// console.log('search.js loaded');

// This is defined in a <script> tag on the html page
// var page_env = "campaign";						// What is the environment of the current page

var search_dropdown_created = false;				// Is the search dropdown currently created/visible
var min_search_term_update_length = 2;				// Search term minimum char length before the dropdown box starts to update
var match_page_env_only = false;					// Should we only match search terms from the current environment e.g. campaign/battle
var current_search_term = "";						// What is the search term currently in the search box
var currently_highlighted_dropdown_item = false;	// What is the currently-highlighted search term in the dropdown box (if any)






/////////////////////////////////////////////////////////////////////////////////////////////
// Set up a handle to the search bar and call rescan when a keyup event happens
/////////////////////////////////////////////////////////////////////////////////////////////

const search_bar = document.forms['search'].querySelector('input');

search_bar.addEventListener(
	'keyup',
	rescan
);

// explicitly block up and down arrows from moving the cursor on keydown in the search bar
search_bar.addEventListener(
	'keydown',
	function(context)
	{
		switch (window.event.keyCode)
		{
			case 38:
			case 40:
				context.preventDefault();
				context.stopPropagation();
				break;
		}
	}
);







/////////////////////////////////////////////////////////////////////////////////////////////
// If a click anywhere occurs and the search box does not have focus then remove
// any drop down highlight
/////////////////////////////////////////////////////////////////////////////////////////////

window.addEventListener(
	'click',
	function()
	{
		if (!search_bar.has_focus)
		{
			highlightDropDownItem();
		}
	}
);







/////////////////////////////////////////////////////////////////////////////////////////////
// Set up a handle to the search checkbox. If it exists set up some event listeners
// to call rescan. 
/////////////////////////////////////////////////////////////////////////////////////////////


var search_env_checkbox;

if (document.forms['search_env_checkbox'])
{
	search_env_checkbox = document.forms['search_env_checkbox'].querySelector('input');

	search_env_checkbox.addEventListener(
		'click',
		rescan
	);

	search_env_checkbox.addEventListener(
		'keyup',
		rescan
	);
};

function is_search_env_checkbox_checked()
{
	if (search_env_checkbox)
	{
		return search_env_checkbox.checked;
	}
	
	return false;
}

	





/////////////////////////////////////////////////////////////////////////////////////////////
// Read the text in the search bar and the checkbox value
// and search the all_terms array, which is generated by
// the docgen process and defined in searchdata.js
/////////////////////////////////////////////////////////////////////////////////////////////
	
function rescan(context)
{	
	// Read in the current value of the current-env-only checkbox
	var current_env_setting_changed = false;
	var search_env_checkbox_checked = is_search_env_checkbox_checked();
	
	if (search_env_checkbox_checked != match_page_env_only)
	{
		match_page_env_only = search_env_checkbox_checked;
		current_env_setting_changed = true;
	}
	
	var esc_key_pressed = false;
	
	// Has a key been pressed
	switch (window.event.keyCode)
	{
		case 13:
			// ENTER key pressed - try and navigate pages based on the currently-highlighted item
			navigateDropDownItem(currently_highlighted_dropdown_item);
			return;
			
		case 27:
			// ESC key pressed
			esc_key_pressed = true;
			break;
		
		case 38:
			// Up arrow key pressed
			if (highlightSiblingDropDownItem(false))
			{
				context.preventDefault();
				context.stopPropagation();
			}
			break;
		case 40:
			// Down arrow key pressed
			if (highlightSiblingDropDownItem(true))
			{
				context.preventDefault();
				context.stopPropagation();
			}
			break;
	}
	
	// Read the current search term from the input box
	const search_term = search_bar.value.toLowerCase();
	
	// If the search term hasn't changed from what was recorded previously then exit
	if (!current_env_setting_changed && !esc_key_pressed && search_term == current_search_term)
	{
		return;
	}
	
	current_search_term = search_term;
	
	// Build a matching_terms list of all terms that match our search term.
	// If the search term is less than the minimum length then do not search.
	// If we're here because the ESC key has been pressed then also do not search.
	var matching_terms = [];
	if (!esc_key_pressed && search_term.length > min_search_term_update_length)
	{
		all_terms.forEach(
			function(current_term)
			{
				if (current_term.term.indexOf(search_term) != -1)
				{
					// If we get here then the search term has been found in the current term
					if (match_page_env_only)
					{
						// We are only matching the page's environment, so only add the
						// current term if it matches
						var current_term_current_env_url = current_term.envs[page_env];
						if (current_term_current_env_url)
						{
							matching_terms.push({
								term: current_term.term,
								env: page_env,
								url: current_term_current_env_url
							});
						}
					}
					else
					{
						// We are not matching the page's environment, so add
						// all environments associated with the current term
						for (const env of Object.keys(current_term.envs)) 
						{
							matching_terms.push({
								term: current_term.term,
								env: env,
								url: current_term.envs[env]
							})
						}
					}
				}
			}
		)
	}
	
	// Call the update function with the matching terms list
	updateDropdown(matching_terms);
}







/////////////////////////////////////////////////////////////////////////////////////////////
// Update the dropdown after rescanning
/////////////////////////////////////////////////////////////////////////////////////////////

function updateDropdown(matching_terms)
{	
	var search_dropdown = document.getElementById("search_dropdown");
	
	// If there are no matching terms then destroy the dropdown
	if (matching_terms.length == 0)
	{
		removeDropdownEventListeners(search_dropdown);
		search_dropdown.innerHTML = "";
		search_dropdown_created = false;
		highlightDropDownItem();
		return;
	}
	
	// Create and set up the dropdown if it doesn't already exist
	if (!search_dropdown_created)
	{
		search_dropdown_created = true;
		highlightDropDownItem();
		addDropdownEventListeners(search_dropdown);
	}
	
	// Create a string for the dropdown list
	var html = `<div id="dropdown_items" class="dropdown_items" style="transform: translate(0px, 0px);">`;
	
	// Add a row entry for each item in our matching_terms array
	matching_terms.forEach(
		function(current_term)
		{
			html += `<div class='dropdown_item' url='${path_to_document_root}${current_term.url}'><div class='dropdown_item_term'>${current_term.term}</div><div class='dropdown_item_env' style='background:${env_bg_colours[current_term.env]};'>${current_term.env}</div></div>`;
		}
	);
	
	// Close
	html += `</div>`;
	
	// Inject this html into the search dropdown box
	search_dropdown.innerHTML = html;
}








/////////////////////////////////////////////////////////////////////////////////////////////
// Add + remove mouseover and click listeners on creation/destruction of the dropdown list
/////////////////////////////////////////////////////////////////////////////////////////////

function addDropdownEventListeners(search_dropdown)
{
	search_dropdown.addEventListener('mouseover', mouseOverDropDownItem);
	search_dropdown.addEventListener('click', mouseClickDropDownItem)
}


function removeDropdownEventListeners(search_dropdown)
{
	search_dropdown.removeEventListener('mouseover', mouseOverDropDownItem);
	search_dropdown.removeEventListener('click', mouseClickDropDownItem)
}








/////////////////////////////////////////////////////////////////////////////////////////////
// Highlight a particular dropdown item
/////////////////////////////////////////////////////////////////////////////////////////////

function highlightDropDownItem(dropdown_item)
{	
	// If there already is a dropdown item highlighted then un-highlight it
	if (currently_highlighted_dropdown_item)
	{
		currently_highlighted_dropdown_item.firstChild.style.backgroundColor = "";
	}
	
	// Record this new dropdown item as the currently-highlighted item
	currently_highlighted_dropdown_item = dropdown_item;
	
	// Highlight the item (if we actually got one, it's valid to pass in nothing)
	if (dropdown_item)
	{
		dropdown_item.firstChild.style.backgroundColor = "#eee";
	}
}







/////////////////////////////////////////////////////////////////////////////////////////////
// Highlight the next/previous dropdown item
/////////////////////////////////////////////////////////////////////////////////////////////

function highlightSiblingDropDownItem(is_down_key)
{	
	// If we have no currently-highlighted item, the list actually contains items 
	// and we've pressed the down key, then highlight the first item in the list
	if (!currently_highlighted_dropdown_item)
	{		
		if (is_down_key)
		{
			var dropdown_items = document.getElementById("dropdown_items");
			
			if (dropdown_items && dropdown_items.childElementCount > 0)
			{
				highlightDropDownItem(dropdown_items.firstChild);
				return true;
			}
		}
		
		return false;
	}
	
	if (is_down_key)
	{
		// Down key pressed
		var next_sibling = currently_highlighted_dropdown_item.nextSibling;
		if (next_sibling)
		{
			highlightDropDownItem(next_sibling);
		}
	}
	else
	{
		// Up key pressed
		var previous_sibling = currently_highlighted_dropdown_item.previousSibling;
		if (previous_sibling)
		{
			highlightDropDownItem(previous_sibling);
		}
	}
	return true;
}







/////////////////////////////////////////////////////////////////////////////////////////////
// Navigate to the url encoded into a dropdown item - loads away from this page
/////////////////////////////////////////////////////////////////////////////////////////////

function navigateDropDownItem(dropdown_item)
{
	if (!dropdown_item)
	{
		return;
	}
	
	var url = dropdown_item.getAttribute("url");
	if (url)
	{
		window.location.href = url;
	}
}







/////////////////////////////////////////////////////////////////////////////////////////////
// Handle mouse events on a dropdown item
/////////////////////////////////////////////////////////////////////////////////////////////

function mouseOverDropDownItem(context)
{	
	// Each dropdown row has a parent dropdown_item div and multiple child divs that float
	// inline with one another. It will be the child that will have received the mouseover
	// event, but we highlight, pass around, and store urls with the parent
	var parent = context.target.parentElement;
	
	if (parent && parent.className == "dropdown_item")
	{
		highlightDropDownItem(parent);
	}
	else
	{
		highlightDropDownItem();
	}	
}


function mouseClickDropDownItem(context)
{	
	var parent = context.target.parentElement;
	
	if (parent && parent.className == "dropdown_item")
	{
		navigateDropDownItem(parent);
	}
}


