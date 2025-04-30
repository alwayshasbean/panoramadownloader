// ==User Script==
// @name         Panorama Tile Downloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Download panorama image tiles
// @author       alwayshasbean
// @match        https://yandex.ru/maps  // Adjust this to match the specific site you want to target
// @grant        GM_download
// ==/User Script==

(function() {
    'use strict';

    // Function to download image tiles
    function downloadTiles(baseUrl, resolutions, positions) {
        resolutions.forEach(res => {
            positions.forEach(pos => {
                const tileUrl = `${baseUrl}/${res}.${pos.x}.${pos.y}.jpg`; // Adjust the extension if needed
                GM_download(tileUrl, `${res}.${pos.x}.${pos.y}.jpg`);
            });
        });
    }

    // Example usage
    const baseUrl = 'https://example.com/tiles'; // Change this to the base URL of your tiles
    const resolutions = ['0', '1', '2', '3', '4']; // Add or modify resolutions as needed
    const positions = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        // Add more positions as needed
    ];

    // Add a button to trigger the download
    const button = document.createElement('button');
    button.innerText = 'Download Panorama Tiles';
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.zIndex = 1000;
    button.onclick = () => downloadTiles(baseUrl, resolutions, positions);
    document.body.appendChild(button);
})();