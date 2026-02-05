import { Helmet } from "react-helmet-async";

const SchemaMarkup = () => {
    const siteUrl = "https://xivi.in"; // Replace with actual domain

    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "XIVI",
        "url": siteUrl,
        "logo": `${siteUrl}/favicon_xivi.png`,
        "description": "Exquisite Silver Jewellery & Accessories handcrafted for the modern individual.",
        "sameAs": [
            "https://www.instagram.com/xivi_silver",
            "https://twitter.com/XIVI_Silver",
            "https://youtube.com/@XIVI"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+91-XXXXXXXXXX",
            "contactType": "customer service",
            "areaServed": "IN",
            "availableLanguage": "en"
        }
    };

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "XIVI Silver Jewellery",
        "url": siteUrl,
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${siteUrl}/products?search={search_term_string}`
            },
            "query-input": "required name=search_term_string"
        }
    };
    const navigationSchema = {
        "@context": "https://schema.org",
        "@type": "SiteNavigationElement",
        "name": [
            "Home",
            "About",
            "Products",
            "Contact"
        ],
        "url": [
            `${siteUrl}/`,
            `${siteUrl}/about`,
            `${siteUrl}/products`,
            `${siteUrl}/contact`
        ]
    };

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(organizationSchema)}
            </script>
            <script type="application/ld+json">
                {JSON.stringify(websiteSchema)}
            </script>
            <script type="application/ld+json">
                {JSON.stringify(navigationSchema)}
            </script>
        </Helmet>
    );
};

export default SchemaMarkup;
