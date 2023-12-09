import { updatePageTitles } from './common.js';

const parser = new DOMParser();

document.inits["questionnaire"] = () => {
	updatePageTitles("Questionnaire");
	const contentElement = document.querySelector('#questionnaire');
	if (contentElement) {
	  loadQuestionnaire(contentElement);
	}
};

/**
 * Load HTML template files asynchronously.
 * @param {string} templatePath - The path to the HTML template file.
 * @returns {Promise<string>} A Promise that resolves to the loaded HTML template.
 */
async function loadTemplateFile(templatePath) {
  const response = await fetch(templatePath);
  if (response.ok) {
    return await response.text();
  } else {
    throw new Error(`Failed to load template: ${templatePath}`);
  }
}

/**
 * Generate the HTML for a question group.
 * @param {Object} groupData - The data for the question group.
 * @param {string} groupTemplate - The HTML template for question groups.
 * @returns {string} The generated HTML for the question group.
 */
function generateQuestionGroupHTML(groupData, groupTemplate) {
  const groupHTML = groupTemplate
    .replace('{{group}}', groupData.display_text)
    .replace('{{groupClass}}', groupData.group_class);
    
  return groupHTML;
}

/**
 * Generate the HTML for a question.
 * @param {Object} questionData - The data for the question.
 * @param {number} questionIndex - The unique index of the question.
 * @param {string} questionTemplate - The HTML template for questions.
 * @returns {string} The generated HTML for the question.
 */
function generateQuestionHTML(questionData, questionIndex, questionTemplate) {
  let questionHTML = questionTemplate
    .replaceAll('{{question}}', questionData.question_text)
    .replaceAll('{{questionIndex}}', `question${questionIndex}`)
    .replaceAll('{{questionID}}', questionData.question_id);
    
  // Set the radio button value based on the provided value (if available)
  if (questionData.hasOwnProperty('value')) {
    const valueIndex = parseInt(questionData.value);
    if (!isNaN(valueIndex) && valueIndex >= 0 && valueIndex <= 4) {
    	console.log("valueIndex", valueIndex);
      // Replace all radio buttons with the same name
      const radioButtons = questionHTML.match(/<input type="radio"[^>]*>/g);
      if (radioButtons) {
        radioButtons.forEach((radioButton, index) => {
    		console.log("radioButton", index);
          if (index === valueIndex) {

    		console.log("replacing", index);
            // Set the checked attribute for the selected radio button
            questionHTML = questionHTML.replace(radioButton, radioButton.replace('>', ' checked="checked">'));
          }
        });
      }
    }
  }
  
  return questionHTML;
}

/**
 * Generate the entire questionnaire HTML based on the provided data.
 * @param {Object[]} data - An array of question group data.
 * @returns {Promise<string>} A Promise that resolves to the generated questionnaire HTML.
 */
async function generateQuestionnaireHTML(data) {
  const [groupTemplate, questionTemplate] = await Promise.all([
    loadTemplateFile('../content/_question-group-template.html'),
    loadTemplateFile('../content/_question-template.html')
  ]);

  console.log(data);
  let questionnaireHTML = "";
  data.question_groups.forEach((groupData, groupIndex) => {
    const groupHTML = generateQuestionGroupHTML(groupData, groupTemplate);
    const groupElement = parser.parseFromString(groupHTML, "text/html").body.firstChild;
    groupData.questions.forEach((questionData, questionIndex) => {
      const questionHTML = generateQuestionHTML(
        questionData,
        groupIndex * 100 + questionIndex, // Unique question index
        questionTemplate
      );
      const questionElement = parser.parseFromString(questionHTML, "text/html").body.firstChild;
      groupElement.appendChild(questionElement);
    });
    questionnaireHTML += groupElement.outerHTML;
  });

  return questionnaireHTML;
}

/**
 * Load the questionnaire data from a JSON file.
 * @returns {Promise<Object[]>} A Promise that resolves to an array of question group data.
 */
async function loadQuestionnaireData() {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch('http://localhost:8000/get_data', { headers });

    if (response.ok) {
        return await response.json();
    } else {
        throw new Error('Failed to load questionnaire data.');
    }
}

/**
 * Load and insert the generated questionnaire HTML into the specified content element.
 * @param {HTMLElement} contentElement - The HTML element where the questionnaire will be inserted.
 */
export function loadQuestionnaire(contentElement) {
  // Get the main content element and insert the generated questionnaire HTML
  if (contentElement) {
    loadQuestionnaireData()
      .then(data => generateQuestionnaireHTML(data))
      .then(html => {
        contentElement.innerHTML = html;
      })
      .catch(error => {
        console.error('Error loading questionnaire data:', error);
      });
  }
}
