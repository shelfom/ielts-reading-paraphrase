# Data Directory

Place IELTS reading passage JSON files here.

## Required Files

### manifest.json
An index listing all available passages:

```json
[
  {
    "id": "passage-01",
    "title": "Passage Title",
    "filename": "passage-01",
    "difficulty": "Band 6",
    "topic": "Science"
  }
]
```

### Passage Files (e.g. passage-01.json)
Each passage file follows the `ReadingPassage` interface:

```json
{
  "id": "passage-01",
  "title": "Passage Title",
  "content": "Paragraph text here...",
  "questions": [
    {
      "id": "q1",
      "prompt": "Question text?",
      "options": [
        { "label": "A", "text": "Option A" },
        { "label": "B", "text": "Option B" },
        { "label": "C", "text": "Option C" },
        { "label": "D", "text": "Option D" }
      ],
      "answerIndex": 0,
      "explanation": "Why A is correct."
    }
  ],
  "difficulty": "Band 6",
  "topic": "Science"
}
```
