/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f1fcf4',
          100: '#dff9e6',
          200: '#c2f0ce',
          300: '#91e4a8',
          400: '#5ace7b',
          500: '#34b359', 
          600: '#279a48',// primary-600 shade
          700: '#217439',
          800: '#1f5c31',
          900: '#1b4c2a',
        },
        viewDetailHover:'#00A32F',
        viewDetailPressed:'#145C29',
        sideBarHoverbg:'#E5FCFF',
        sideBarHoverbgPressed:'#C6F7FE',
        tabActiveColor:'#38B52B',
        tabHoverColor:'#3EF459',
        tabPressedColor:'#38B52B',
        customBlue: "#09549D",
        firstBlack: "#171717",
        secondBlack: "#0A0A0A",
        tableBorder: "#F1F1F1",
        customBorder: "#F5F6F7",
        progressBtn: "#00F",
        approveBtn: "#38B52B",
        underreviewbtn: "#FFA900",
        rejectBtn: "#FE0000",
        textGrey: "#999",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        cardBg: "linear-gradient(107deg, #2D60FF 2.61%, #539BFF 101.2%)",
        card: "linear-gradient(107deg, #4C49ED 2.61%, #0A06F4 101.2%)",
        cardFooter:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.00) 100%)",
          'header-gradient': "linear-gradient(206deg, #279A48 28.85%, rgba(245, 247, 248, 0.00) 89.55%)",
      },
      boxShadow: {
        loginBoxShadow: "1px 3px 3px 0px rgba(0, 0, 0, 0.25)",
        borderShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)",
        lastTransaction: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        lastTransactionList: "0px 0px 1px 0px rgba(0, 0, 0, 0.25)",
        hoverInputShadow: " 0px 0px 4px 0px rgba(0, 0, 0, 0.25)",
        dashboardShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.30), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities(
        {
          ".placeholder-font-weight-100::placeholder": {
            fontWeight: "100",
          },
          ".placeholder-font-weight-200::placeholder": {
            fontWeight: "200",
          },
          ".placeholder-font-weight-300::placeholder": {
            fontWeight: "300",
          },
          ".placeholder-font-weight-400::placeholder": {
            fontWeight: "400",
          },
          ".placeholder-font-weight-500::placeholder": {
            fontWeight: "500",
          },
          ".placeholder-font-weight-600::placeholder": {
            fontWeight: "600",
          },
          ".placeholder-font-weight-700::placeholder": {
            fontWeight: "700",
          },
        },
        ["responsive", "hover"]
      );
    },
  ],
};
