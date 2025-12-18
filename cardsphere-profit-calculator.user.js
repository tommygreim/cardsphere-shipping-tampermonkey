// ==UserScript==
// @name         Cardsphere Profit Calculator
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Calculate actual profit after shipping costs for Cardsphere packages
// @author       You
// @match        https://www.cardsphere.com/send
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Shipping costs
    const SHIPPING_US = 0.78;
    const SHIPPING_INTERNATIONAL = 1.70;

    function calculateProfits() {
        // Find all packages using the new React/CSS modules class structure
        const packages = document.querySelectorAll('[class*="PotentialPackage"][class*="container"]');

        packages.forEach(pkg => {
            // Find the header section
            const header = pkg.querySelector('[class*="PotentialPackage"][class*="header"]');
            if (!header) return;

            // Find the country flag to determine shipping cost
            const flagSpan = header.querySelector('span.fi[title]');
            if (!flagSpan) return;

            const country = flagSpan.getAttribute('title');
            const isUS = country === 'United States of America';
            const shippingCost = isUS ? SHIPPING_US : SHIPPING_INTERNATIONAL;

            // Find all direct child divs in the header
            const headerDivs = header.querySelectorAll(':scope > div');
            if (headerDivs.length < 3) return;

            // The third div contains the price information: <b>$7.95</b>&nbsp;&nbsp;100% of $7.95
            const priceDiv = headerDivs[2];

            // Find the offer price in the <b> tag
            const offerPriceElement = priceDiv.querySelector('b');
            if (!offerPriceElement) return;

            const offerPriceText = offerPriceElement.textContent.trim();
            const offerPrice = parseFloat(offerPriceText.replace('$', ''));

            // Extract the market price from the text after the <b> tag
            const priceDivText = priceDiv.textContent;
            // Pattern: "X% of $Y.YY"
            const marketPriceMatch = priceDivText.match(/of\s+\$(\d+\.\d+)/);
            if (!marketPriceMatch) return;

            const marketPrice = parseFloat(marketPriceMatch[1]);

            // Calculate post-shipping values
            const postShippingPrice = offerPrice - shippingCost;
            const postShippingPercent = (postShippingPrice / marketPrice * 100).toFixed(0);

            // Check if we've already added the post-shipping info
            if (priceDiv.querySelector('.post-shipping-info')) return;

            // Create new elements to display post-shipping values
            const postShippingDiv = document.createElement('div');
            postShippingDiv.className = 'post-shipping-info';
            postShippingDiv.style.color = '#28a745'; // Green color
            postShippingDiv.style.marginTop = '5px';

            const priceSpan = document.createElement('b');
            priceSpan.textContent = `$${postShippingPrice.toFixed(2)}`;
            priceSpan.style.color = '#28a745';

            const percentSpan = document.createElement('span');
            percentSpan.textContent = ` ${postShippingPercent}% of $${marketPrice.toFixed(2)}`;
            percentSpan.style.color = '#28a745';

            postShippingDiv.appendChild(priceSpan);
            postShippingDiv.appendChild(percentSpan);

            // Add to the price div
            priceDiv.appendChild(document.createElement('br'));
            priceDiv.appendChild(postShippingDiv);
        });
    }

    // Run when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', calculateProfits);
    } else {
        calculateProfits();
    }

    // Run multiple times with delays to catch dynamically loaded content
    setTimeout(calculateProfits, 1000);
    setTimeout(calculateProfits, 2000);

    // Watch for changes to the package list (in case it's dynamically updated)
    const observer = new MutationObserver(() => {
        calculateProfits();
    });

    // Wait for the container to exist before observing
    const waitForContainer = setInterval(() => {
        const packagesContainer = document.querySelector('[class*="SendPage"][class*="packageContainer"]');
        if (packagesContainer) {
            clearInterval(waitForContainer);
            observer.observe(packagesContainer, {
                childList: true,
                subtree: true
            });
        }
    }, 500);
})();
