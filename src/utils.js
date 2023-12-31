export async function getPageContent(url) {
  // This is a really scrappy way to do this.
  // Don't do this in production!

  const response = await fetch(url);
  const text = await response.text();
  // Particularly as it uses regexp

  return /<body[^>]*>([\w\W]*)<\/body>/.exec(text)[1];
}

function isBackNavigation(navigateEvent) {
  if (
    navigateEvent.navigationType === "push" ||
    navigateEvent.navigationType === "replace"
  ) {
    return false;
  }

  if (
    (navigateEvent.destination.index !== -1 &&
      navigateEvent.destination.index < navigateEvent.currentEntry,
    index)
  ) {
    return true;
  }
  return false;
}

export async function onLinkNavigate(callback) {
  navigation.addEventListener("navigate", (event) => {
    const toUrl = new URL(event.destination.url);

    if (location.origin !== toUrl.origin) return;

    const fromPath = location.pathname;
    const isBack = isBackNavigation(event);

    event.intercept({
      handler() {
        if (event.info === "ignore") return;

        callback({
          toPath: toUrl.pathname,
          fromPath,
          isBack,
        });
      },
    });
  });
}

export function getLink(href) {
  const fullLink = new URL(href, location.href).href;

  return [...document.querySelectorAll("a")].find(
    (link) => link.href === fullLink
  );
}

// This helper function returns a View-Transition-like object, even for browsers that don't support view transitions.
// It won't do the transition in unsupported browsers, it'll act as if the transition is skipped.
// It also makes it easier to add class names to the document element.

export function transitionHelper({
  skipTransition = false,
  className = "",
  updateDOM,
}) {
  if (skipTransition || !document.startViewTransition) {
    const domUpdated = Promise.resolve(updateDOM()).then(() => undefined);

    return {
      ready: Promise.reject(Error("view transition unsupported")),
      domUpdated,
      finished: domUpdated,
    };
  }

  const classNamesArray = className.split(/\s+/g).filter(Boolean);

  document.documentElement.classList.add(...classNamesArray);

  const transition = document.startViewTransition(updateDOM);

  transition.finished.finally(() =>
    document.documentElement.classList.remove(...classNamesArray)
  );

  return transition;
}
