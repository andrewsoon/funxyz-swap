# FunXYZ Swap

A React-based token price explorer and swap interface, allowing users to compare ERC-20 token values in real-time before swapping.

## 🚀 Features

- Real-time token price fetching from the Funkit API
- Quick-select tokens for easy input
- Automatic conversion between source and destination tokens
- Responsive design with modern UI
- Modal for selecting tokens
- BigNumber support for precise calculations

## 🌍 Live Demo

[View the deployed application](https://funxyz-swap-preview.vercel.app/)

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Funkit API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/andrewsoon/funxyz-swap.git
cd funxyz-swap
```

2. Install dependencies

```
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with your Funkit API key:

```
VITE_API_KEY=your_funkit_api_key_here
```

4. Start the development server
```
npm run dev
# or
yarn dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🧪 Libraries Used

- `BigNumber.js` for handling token decimals and conversions safely.
- Funkit API for token data and price information.
- React Hooks (`useState`, `useEffect`, `useMemo`) for state and lifecycle management.

## ⚡ Usage

- Select a source token using the input or quick-select buttons.
- Enter the amount to see the equivalent value in the destination token.
- Click the token buttons to open a modal and select a different token.
- The app automatically fetches prices every 10 seconds.
- Amounts are synchronized based on the last edited input.
- The "Swap" button is currently disabled as a placeholder for future swap functionality.

## 📌 Assumptions and Design Choices

- Only whitelisted ERC-20 tokens are available for selection.
- Price conversion is based on the latest fetched unit prices.
- Source and destination token amounts are synchronized using a "last edited" field.
- Input validation ensures amounts are non-negative.
- Modal is used for a clean token selection experience.
- No use of `useRef` or `useCallback` since inputs and event handlers are simple enough.
- Avoided MUI or other heavy component libraries to keep the bundle size and load speed small.
- Did not use Redux or Redux-Saga, assuming a single-page application with local state is sufficient.
- Followed closely to the main company’s design system (Fun.xyz) for visual consistency.
- Updated meta tags to match Fun.xyz branding.

## 9. Future Enhancements

- Implement actual token swap functionality.
- Add support for more tokens and chains.
- Consider Redux/Redux-Saga for more complex state management if the app grows.
- Handle network errors and offline mode gracefully.
- Add theming (light/dark mode).
- Input validation with max length and decimal restrictions.

