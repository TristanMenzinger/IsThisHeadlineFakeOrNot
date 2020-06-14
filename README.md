# Is this Headline Fake or Not?

We live in crazy times - but can you tell how crazy? Visit [isthisheadlinefake.com](https://isthisheadlinefake.com) to find out. 



### Why
We made this to show two things:
* Neural networks have become incredibly good at producing grammatically correct but completely nonsensical text
* There are so many nonsensical headlines nowadays, it's hard to distinguish fake from real

### How
* We trained the network on 200'000 real headlines from the [Huffington Post](https://www.huffpost.com)
using OpenAI's [GPT-2](https://github.com/openai/gpt-2!). If you want to experiment yourself, you can find the dataset [here](https://www.kaggle.com/rmisra/news-category-dataset).
* Hosted on Github Pages using Cloudflare Workers & Key-Value store. Using native CSS transforms for the animations.


### Who
Made by [Robin Weitzel](https://github.com/RobinWeitzel) and [Tristan Menzinger](https://github.com/TristanMenzinger).

### Disclaimer
Half of the headlines are from the Huffington Post, the other half is machine generated. We do not claim authenticity for any of these headlines. The headlines are posted for comedic purposes only and not meant to attack anyone. If you find a headline offensive please get in touch via GitHub.
