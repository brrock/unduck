# Unduck

  

DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables all of DuckDuckGo's bangs to work, but much faster.

  

```

https://unduck-chi.vercel.app/?q=%s

```

  

## How is it that much faster?

  

DuckDuckGo does their redirects server side. Their DNS is...not always great. Result is that it often takes ages.

  

I solved this by doing all of the work client side. Once you've went to https://unduck-chi.vercel.app once, the JS is all cache'd and will never need to be downloaded again. Your device does the redirects, not me.

# My chnages

- Dark mode  [PR](https://github.com/t3dotgg/unduck/pull/13)
- Default bang edit UI [PR](https://github.com/t3dotgg/unduck/pull/47)
- Save default bang to cookie - me
- Add default bang as url param - me
- Update bang script which runs on postinstall and adds my bangs
- Add chatgpt bangs
