/**
 * [TODO] Step 0: Import the dependencies, fs and papaparse
 */

const fs = require('fs');
const Papa = require('papaparse');

/**
 * [TODO] Step 1: Parse the Data
 *      Parse the data contained in a given file into a JavaScript objectusing the modules fs and papaparse.
 *      According to Kaggle, there should be 2514 reviews.
 * @param {string} filename - path to the csv file to be parsed
 * @returns {Object} - The parsed csv file of app reviews from papaparse.
 */
function parseData(filename) {
    const csvString = fs.readFileSync(filename, 'utf8');

    const parsed = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
    });

    return parsed;
}

/**
 * [TODO] Step 2: Clean the Data
 *      Filter out every data record with null column values, ignore null gender values.
 *
 *      Merge all the user statistics, including user_id, user_age, user_country, and user_gender,
 *          into an object that holds them called "user", while removing the original properties.
 *
 *      Convert review_id, user_id, num_helpful_votes, and user_age to Integer
 *
 *      Convert rating to Float
 *
 *      Convert review_date to Date
 * @param {Object} csv - a parsed csv file of app reviews
 * @returns {Object} - a cleaned csv file with proper data types and removed null values
 */
function cleanData(csv) {
    const { data } = csv;

    const requiredFields = [
        'review_id',
        'app_name',
        'app_category',
        'review_text',
        'review_language',
        'rating',
        'review_date',
        'verified_purchase',
        'device_type',
        'num_helpful_votes',
        'app_version',
        'user_id',
        'user_age',
        'user_country',
    ];

    const isMissing = (v) =>
        v === null ||
        v === undefined ||
        v === '' ||
        v === 'null' ||
        v === 'NULL';

    const cleaned = data
        .filter((row) => requiredFields.every((k) => !isMissing(row[k])))
        .map((row) => {
            const { user_id, user_age, user_country, user_gender, ...rest } =
                row;
            return {
                ...rest,
                review_id: parseInt(row.review_id, 10),
                rating: parseFloat(row.rating),
                review_date: new Date(row.review_date),
                verified_purchase: row.verified_purchase === 'true',
                num_helpful_votes: parseInt(row.num_helpful_votes, 10),
                user: {
                    user_id: parseInt(user_id, 10),
                    user_age: parseInt(user_age, 10),
                    user_country,
                    user_gender,
                },
            };
        });
    return cleaned;
}

/**
 * [TODO] Step 3: Sentiment Analysis
 *      Write a function, labelSentiment, that takes in a rating as an argument
 *      and outputs 'positive' if rating is greater than 4, 'negative' is rating is below 2,
 *      and 'neutral' if it is between 2 and 4.
 * @param {Object} review - Review object
 * @param {number} review.rating - the numerical rating to evaluate
 * @returns {string} - 'positive' if rating is greater than 4, negative is rating is below 2,
 *                      and neutral if it is between 2 and 4.
 */
function labelSentiment({ rating }) {
    if (rating > 4) return 'positive';
    if (rating < 2) return 'negative';
    return 'neutral';
}

/**
 * [TODO] Step 3: Sentiment Analysis by App
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each app into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{app_name: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for an app
 */
function sentimentAnalysisApp(cleaned) {
    const countsByApp = {};

    for (const review of cleaned) {
        const sentiment = labelSentiment(review);
        const app = review.app_name;

        if (!countsByApp[app]) {
            countsByApp[app] = {
                app_name: app,
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }

        countsByApp[app][sentiment] += 1;
    }

    return Object.values(countsByApp);
}

/**
 * [TODO] Step 3: Sentiment Analysis by Language
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each language into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{review_language: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for a language
 */
function sentimentAnalysisLang(cleaned) {
    const countsByLang = {};

    for (const review of cleaned) {
        const sentiment = labelSentiment(review);
        const lang = review.review_language;

        if (!countsByLang[lang]) {
            countsByLang[lang] = {
                review_language: lang,
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }

        countsByLang[lang][sentiment] += 1;
    }
    return Object.values(countsByLang);
}

/**
 * [TODO] Step 4: Statistical Analysis
 *      Answer the following questions:
 *
 *      What is the most reviewed app in this dataset, and how many reviews does it have?
 *
 *      For the most reviewed app, what is the most commonly used device?
 *
 *      For the most reviewed app, what the average star rating (out of 5.0)?
 *
 *      Add the answers to a returned object, with the format specified below.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{mostReviewedApp: string, mostReviews: number, mostUsedDevice: String, mostDevices: number, avgRating: float}} -
 *          the object containing the answers to the desired summary statistics, in this specific format.
 */
function summaryStatistics(cleaned) {
    const reviewsPerApp = cleaned.reduce((acc, r) => {
        acc[r.app_name] = (acc[r.app_name] || 0) + 1;
        return acc;
    }, {});

    let mostReviewedApp = '';
    let mostReviews = 0;

    Object.entries(reviewsPerApp).forEach(([app, count]) => {
        if (count > mostReviews) {
            mostReviews = count;
            mostReviewedApp = app;
        }
    });

    const appReviews = cleaned.filter((r) => r.app_name === mostReviewedApp);

    const devices = appReviews.reduce((acc, r) => {
        acc[r.device_type] = (acc[r.device_type] || 0) + 1;
        return acc;
    }, {});

    let mostUsedDevice = '';
    let mostDevices = 0;

    Object.entries(devices).forEach(([devices, count]) => {
        if (count > mostDevices) {
            mostDevices = count;
            mostUsedDevice = devices;
        }
    });

    const sumRatings = appReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRatingRaw =
        appReviews.length === 0 ? 0 : sumRatings / appReviews.length;
    const avgRating = Math.round(avgRatingRaw * 1000) / 1000;

    return {
        mostReviewedApp,
        mostReviews,
        mostUsedDevice,
        mostDevices,
        avgRating,
    };
}

/**
 * Do NOT modify this section!
 */
module.exports = {
    parseData,
    cleanData,
    sentimentAnalysisApp,
    sentimentAnalysisLang,
    summaryStatistics,
    labelSentiment,
};
