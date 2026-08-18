// components/Footer.jsx
import React from 'react';

function Footer() {
    return (
        <footer style={styles.footer}>
            <p style={styles.text}>© {new Date().getFullYear()} Third Shift Media (PVT) LTD. All rights reserved.</p>
        </footer>
    );
}

const styles = {
    footer: {
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: '13px',
        color: '#718096',
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        flexShrink: 0,
        width: '100%',
        boxSizing: 'border-box'
    },
    text: {
        margin: 0
    }
};

export default Footer;
