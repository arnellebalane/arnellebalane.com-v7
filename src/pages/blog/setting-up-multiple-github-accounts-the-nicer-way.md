---
layout: ../../layouts/ArticleLayout.astro
title: 'Setting up multiple GitHub accounts, the nicer way'
summary: 'This is an updated setup for multiple GitHub accounts on the same machine.'
cover_image: /images/blog/setting-up-multiple-github-accounts-the-nicer-way.webp
date: 2019-03-07
---

We previously wrote about setting up multiple GitLab accounts, which works by
relying mostly on SSH config files and using custom hosts as remotes for git
repositories. You can read it by following the link below:

<blockquote>
    <a href="https://medium.com/uncaught-exception/setting-up-multiple-gitlab-accounts-82b70e88c437"><strong>Setting up multiple GitLab accounts</strong></a>
    <p>This tutorial explains how to setup multiple GitLab accounts on the same machine.</p>
    <small>medium.com</small>
</blockquote>

The previous setup works, but I find it inconvenient having to use custom hosts
when cloning repositories or for git remotes all the time, like:

```bash
$ git clone git@gitlab.com-work:work/repository.git
```

I recently (almost) had to deal with the same scenario, on GitHub this time
(hence the title), so I decided to check if I can achieve a better setup. Turns
out that there's a better way to do it — one that does not rely on custom hosts
or modifying any SSH config file.

In this article, we are going to assume that we have two GitHub accounts,
`personal@email.com` and `work@email.com`. When working on work-related
projects we want to commit and push our changes using our work account, while
using our personal account for everything else.

We're also going to assume that we've already defined global configs telling
git to use our personal account. See
[this guide](https://docs.github.com/en/get-started/git-basics/setting-your-username-in-git)
on how to do that.

## Generate SSH keys for each user

GitHub does not allow us to use the same SSH key in multiple accounts, so we'll
have to create separate keys for each account. We can create SSH keys and add
them to our SSH agent by following
[this guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
from the GitHub Documentation.

Once we're done, we will have two sets of SSH keys, e.g.:

- `~/.ssh/id_rsa` and `~/.ssh/id_rsa.pub` (let's use this for our personal account)
- `~/.ssh/work_key` and `~/.ssh/work_key.pub`

Now add the SSH keys to their corresponding GitHub accounts.
[This guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)
shows us how to do that.

## Committing as the correct user

We then modify our `~/.gitconfig` file to use our work account when we are
inside a work-related repository. We are going to use "[Conditional Includes](https://git-scm.com/docs/git-config#_conditional_includes)"
for that, which dynamically adds/removes configuration based on certain
conditions. Let's add the following snippet to our `~/.gitconfig` file:

```ini
[includeIf "gitdir:/path/to/work/repository/"]
    [user]
        email = "work@email.com"
```

This makes git override our global configs and use `work@email.com` when
committing changes inside the work repository. When in any other repository,
our personal account will be used.

### Do this for all work repositories

The way I personally structure my repositories on my file system is I place all
work-related repositories inside the `~/work` directory. This makes it easier
to enable the configs above for all work-related repositories by just using the
work directory in the `includeIf` directive:

```ini
[includeIf "gitdir:~/work/"]
```

## Pushing as the correct user

When we push our commits now, they will be pushed to our personal GitHub
account, even though we've already committed them using our work email. That's
because under the hood, git uses SSH, and SSH uses the `id_rsa` key by default.
So when GitHub receives the push, it will try to determine which user pushed
the commits based on the SSH key used, which will turn out to be our personal
account.

We can resolve this by using the `work_key` SSH key when pushing to our work
repositories. In SSH, this can be done through the `-i` flag, like so:

```bash
$ ssh -i ~/.ssh/work_key ...
```

We can configure git to use a custom SSH command like above by setting
`core.sshCommand`. And since we only want to set it when we're inside any work
repository, we also conditionally include it inside the `includeIf` directive:

```ini
[includeIf "gitdir:/path/to/work/repository/"]
    [user]
        email = "work@email.com"
    [core]
        sshCommand = "ssh -i ~/.ssh/work_key"
```

These configs now make git commit using our work email, as well as make GitHub
associate commits with our work account when we push them 🎉.

## Summary

We've managed to configure git to use different configs when committing and
associating these commits to different GitHub accounts when pushing, based on
what repository we are performing those changes — and we used conditional
includes in git's config file to achieve that.

I like this way better than [the previous setup](https://medium.com/uncaught-exception/setting-up-multiple-gitlab-accounts-82b70e88c437)
since it's more convenient to use (no more custom hosts) and all the config
changes only affect git (no more changing of SSH config files).

If you deal with these multiple GitHub accounts in a different way, please feel
free to share with us how you do it as well!
