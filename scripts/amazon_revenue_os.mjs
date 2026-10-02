import {AMAZON_REVENUE_PROGRAMS,buildRevenuePortfolio} from '../modules/platform/amazon-revenue-os/core.ts';
console.log(JSON.stringify({version:'V216.0.0',programs:AMAZON_REVENUE_PROGRAMS.length,surfaces:buildRevenuePortfolio().surfaces}));
