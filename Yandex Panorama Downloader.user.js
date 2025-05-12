// ==UserScript==
// @name         Yandex Panorama Downloader
// @namespace    http://tampermonkey.net/
// @version      2025-04-30
// @description  Download panorama image tiles
// @author       alwayshasbean
// @match        https://*yandex.ru/maps/*
// @icon         https://lumpics.ru/wp-content/uploads/2018/03/Kak-polzovatsya-YAndeks.Kartami.png
// @grant        GM_download
// @grant        GM_info
// ==/UserScript==

(function() {
    'use strict';

    let lastPanoramaId = null;
    const downloadDelay = 0; // Delay in milliseconds between downloads

	// Extract Panorama ID from XHR requests
	function CaptureSourceID() {
		if (lastPanoramaId) {
			return lastPanoramaId;
		}

		const originalXhrOpen = XMLHttpRequest.prototype.open;
		XMLHttpRequest.prototype.open = function(method, url) {
			const regex3 = /https:\/\/pano\.maps\.yandex\.net\/([^\/]+)\/3\.0\.0/;
			const regex4 = /https:\/\/pano\.maps\.yandex\.net\/([^\/]+)\/4\.0\.0/;

			let match;
			if (url.includes("3.0.0")) {
				match = url.match(regex3);
				if (match && match[1]) {
					lastPanoramaId = match[1];
					console.log(`Captured Panorama ID from 3.0.0: ${lastPanoramaId}`);
				}
			}
			if (url.includes("4.0.0")) {
				match = url.match(regex4);
				if (match && match[1]) {
					lastPanoramaId = match[1];
					console.log(`Captured Panorama ID from 4.0.0: ${lastPanoramaId}`);
				}
			}

			return originalXhrOpen.apply(this, arguments);
		};
	}

	// Function to extract street name and year
	function extractStreetAndYear() {
		const streetElement = document.querySelector('.panorama-player-view__name');
		const yearElement = document.querySelector('.panorama-controls-view__history .button__text');
		const streetName = streetElement ? streetElement.textContent.trim() : 'Unknown Street';
		const year = yearElement ? yearElement.textContent.trim() : 'Unknown Year';
		console.log(`Street Name: ${streetName}`);
		console.log(`Year: ${year}`);
		return { streetName, year };
	}

    // Check if a tile exists
    async function tileExists(tileUrl) {
        try {
            const response = await fetch(tileUrl, { method: 'HEAD' });
            return response.ok; // Returns true if the tile exists
        } catch (error) {
            console.error(`Error checking tile existence: ${error}`);
            return false;
        }
    }

    // Binary search to find the maximum available tile index
    async function binarySearchForTiles(panoramaId, res, isXSearch) {
        let low = 0;
        let high = isXSearch ? 100 : 50; // Adjust based on expected max values
        let maxIndex = -1;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const tileUrl = `https://pano.maps.yandex.net/${panoramaId}/${res}.${isXSearch ? mid : 0}.${isXSearch ? 0 : mid}`;
            if (await tileExists(tileUrl)) {
                maxIndex = mid; // Tile exists, search higher
                low = mid + 1;
            } else {
                high = mid - 1; // Tile does not exist, search lower
            }
        }
        return maxIndex;
    }

    // Download a single tile
    async function downloadTile(streetName, year, panoramaId, res, x, y) {
        const tileUrl = `https://pano.maps.yandex.net/${panoramaId}/${res}.${x}.${y}`;
        const fileName = `${res}.${x}.${y}.jpg`;
        const filePath = `panotiles/${panoramaId} - ${streetName}, ${year}/${res}/${fileName}`; // Save directly to Downloads folder
        await new Promise(resolve => {
            GM_download({
                url: tileUrl,
                name: filePath,
                saveAs: false, // Ensure this is set to false to avoid prompts
                onerror: (error) => {
                    console.error(`Failed to download ${tileUrl}: ${error}`);
                    resolve(); // Resolve the promise even on error
                },
                onload: resolve // Resolve the promise on successful download
            });
        });
    }

    // Main function
    async function capture() {
        const panoramaId = CaptureSourceID();
        if (!panoramaId) {
            alert("Panorama ID not found. Ensure the panorama is fully loaded.");
            return;
        }

        // Extract street name and year
        const { streetName, year } = extractStreetAndYear();

        // Get selected resolutions
        const selectedResolutions = Array.from(document.querySelectorAll('input[name="resolution"]:checked')).map(input => parseInt(input.value));

        for (const res of selectedResolutions) {
            if (await tileExists(`https://pano.maps.yandex.net/${panoramaId}/${res}.0.0`)) {
                let sizeX = 2;
                let sizeY = 2; // Adjust based on expected max values
                const maxX = await binarySearchForTiles(panoramaId, res, true);
                const maxY = await binarySearchForTiles(panoramaId, res, false);

                for (let x = 0; x <= maxX; x++) {
                    for (let y = 0; y <= maxY; y++) {
                        await downloadTile(streetName, year, panoramaId, res, x, y);
                        await new Promise(resolve => setTimeout(resolve, downloadDelay)); // Delay between downloads
                    }
                }
            }
        }
    }

    // Create UI elements
    function createUI() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '82px'; // Moved down by 72 pixels
        container.style.right = '10px';
        container.style.backgroundColor = '#f9f9f9';
        container.style.border = '1px solid #ccc';
        container.style.borderRadius = '5px';
        container.style.padding = '10px';
        container.style.zIndex = '1000';
        container.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';

        const button = document.createElement('button');
        button.textContent = 'Download Tiles';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '10px 15px';
        button.style.textAlign = 'center';
        button.style.textDecoration = 'none';
        button.style.display = 'inline-block';
        button.style.fontSize = '16px';
        button.style.margin = '4px 2px';
        button.style.cursor = 'pointer';
        button.style.borderRadius = '5px';
        button.onclick = capture;
        container.appendChild(button);

        const resolutionContainer = document.createElement('div');
        resolutionContainer.innerHTML = '<h3>Select Resolutions:</h3>';
        const resolutions = [0, 1, 2, 3, 4]; // Resolutions to display
        resolutions.forEach(res => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'resolution';
            checkbox.value = res;
            const label = document.createElement('label');
            label.textContent = res; // Reduced text to a single number
            label.style.marginRight = '10px'; // Space between checkboxes
            resolutionContainer.appendChild(checkbox);
            resolutionContainer.appendChild(label);
        });
        container.appendChild(resolutionContainer);
        document.body.appendChild(container);
    }

    createUI();
    // Initial setup
    CaptureSourceID();
})();