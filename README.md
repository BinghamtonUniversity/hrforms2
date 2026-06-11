# HR Forms 2.0

A modern, React-based Human Resources forms management interface for streamlined employee data management, form submissions, and HR workflow administration.

**Version:** 2.1.1

## Overview

HR Forms 2.0 provides a comprehensive web application for managing HR forms, position requests, and administrative workflows. The interface features dynamic form handling, real-time data management, and comprehensive admin capabilities for managing departments, groups, users, and form templates.

## Features

- **Form Management**: Create, view, edit, and archive HR forms with comprehensive validation
- **Position Requests**: Track and manage position requests with workflow support
- **Employee Data**: Manage employee information including:
  - Demographics and contact information
  - Education and directory listings
  - Employment history (appointments, leaves, pay, positions, salary, separations)
- **Admin Dashboard**: Full administrative control including:
  - User and group management
  - Department hierarchy management
  - Form and template configuration
  - Transaction code management
  - System settings and configuration
- **Review Workflow**: Submission review process with detailed comments and audit trails
- **Responsive Design**: Works across desktop and mobile devices with Bootstrap 4

## Tech Stack

### Frontend
- **React.js** - UI framework
- **React Bootstrap v4** - Bootstrap 4 components for React
- **React Router** - Client-side routing
- **React Query v3** - Data fetching and state management
- **Lodash v4** - Utility functions
- **date-fns** - Date manipulation and formatting
- **Iconify React** - Icon library
- **Webpack** - Module bundler

### Backend
- **PHP** - Server-side processing
- **Composer** - PHP dependency management

### Build Tools
- **Babel** - JavaScript transpilation
- **SCSS/SASS** - Stylesheet preprocessing
- **webpack** - Module bundling and code splitting
- **terser-webpack-plugin** - JavaScript minification
- **css-minimizer-webpack-plugin** - CSS minification

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PHP 8.1+ (for backend services)
  - oci8 - Oracle OCI library; see PHP documentation for install and setup instructions
- Composer (for PHP dependencies)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/BinghamtonUniversity/hrforms2;
   cd hrforms2;
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```
   *Note: some dependencies are deprecated and may display warnings during install.*

3. **Install PHP dependencies**
   ```bash
   cd dist;
   composer install;
   ```

4. **Configure environment**
    ```bash
    cp .env.example .env
    ```
    Update the values in `.env` accordingly.

## Development

### Available Scripts

#### Build Production
```bash
npm run build
```
Builds the production bundle with minified assets and prepares the distribution folder.

#### Build Development
```bash
npm run build-dev
```
Builds development bundle with source maps for debugging.

#### Webpack Build
```bash
npm run webpack
```
Runs webpack in production mode.

#### Development Webpack
```bash
npm run webpack-dev
```
Runs webpack in development mode.

#### Build CSS
```bash
npm run build-css
```
Compiles SCSS to minified CSS.

#### Clean Artifacts
```bash
npm run clean-dist    # Remove all distribution files
npm run clean-js      # Remove built JavaScript files
```

#### List Build Artifacts
```bash
npm run list
```
Lists all generated files with timestamps and sizes.

### Project Structure

```
src/
├── index.php              # Main PHP entry point
├── js/
│   ├── app.js            # Main application initialization
│   ├── main.js           # Application entry point
│   ├── queries.js        # Database query handlers
│   ├── utility.js        # Utility functions
│   ├── blocks/           # React component blocks
│   │   ├── form/         # Form-related components
│   │   ├── request/      # Request-related components
│   │   ├── admin/        # Admin interface components
│   │   ├── footer.js
│   │   ├── news.js
│   │   └── ...
│   ├── pages/            # Page-level components
│   │   ├── form/         # Form pages
│   │   ├── request/      # Request pages
│   │   ├── admin/        # Admin pages
│   │   └── ...
│   ├── queries/          # Query modules (forms, users, etc.)
│   ├── config/           # Application configuration
│   └── css/              # Stylesheets
├── scss/                 # SCSS source files
│   ├── binghamton-bs4.scss
│   └── a11y-color.scss
└── images/              # Image assets
    └── svg-spinners/    # SVG spinner animations
```

### Key Directories

- **blocks**: Reusable React components organized by functional domain
- **pages**: Page-level components that compose blocks and handle routing
- **queries**: Data query modules for different entities (forms, users, requests, etc.)
- **config**: Application configuration files for different modules
- **scss**: Style source files using SCSS preprocessing

## Deployment

### Development Environment
```bash
npm run deploy-dev
npm run deploy-git-dev
```

### Production Environment
```bash
npm run deploy-git-prod
```

All deployment scripts are located in the `scripts/` directory.

## Component Reference

### Core Libraries
- [ReactJS](https://reactjs.org/) - React documentation
- [React Bootstrap v4](https://react-bootstrap-v4.netlify.app/) - Bootstrap components for React
- [lodash v4](https://lodash.com/docs/4.17.15) - Utility function library
- [date-fns](https://date-fns.org/) - Date utility library
- [React Query v3](https://react-query-v3.tanstack.com/) - Server state management

### Icons
- [Iconify](https://iconify.design/) - Comprehensive icon library with React support

### Styling
- [Bootstrap 4](https://getbootstrap.com/docs/4.6/) - CSS framework
- [SCSS/SASS](https://sass-lang.com/) - Style preprocessing

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

## License

ISC

## Author

[Scott Geiger](https://github.com/geigersBinghamton)

## Contributing

For contribution guidelines and development setup, please contact the author.
