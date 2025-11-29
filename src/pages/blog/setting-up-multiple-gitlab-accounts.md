---
layout: ../../layouts/ArticleLayout.astro
title: 'Setting up multiple GitLab accounts'
summary: 'This tutorial explains how to setup multiple GitLab accounts on the same machine.'
date: 2017-12-18
---

**Update, 2019–03–07:** I've published an updated version of this article,
which you can check out in the following link:

<blockquote>
    <a href="/blog/setting-up-multiple-github-accounts-the-nicer-way"><strong>Setting up multiple GitHub accounts, the nicer way</strong></a>
    <p>This is an updated setup for multiple GitHub accounts on the same machine.</p>
    <small>arnellebalane.com</small>
</blockquote>

---

Here's a scenario: you want to use multiple GitLab (or GitHub, etc.) on your
machine. One could be your personal account and another one you use
specifically for work. You want to use different SSH keys to access the
repositories in either account.

Here's how to achieve that setup properly. For this article, let's assume we
have the two GitLab accounts:

- **Personal Account**, username: `personal`, email: `personal@email.com`
- **Work Account**, username: `work`, email: `work@email.com`

## Generate SSH keys for each user

GitLab does not allow you to use the same SSH key in multiple accounts, so
you'll have to create separate keys for each account. You can create SSH keys
and add them to your SSH agent by following
[this guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
from the GitHub Documentation.

Once you're done, you will have two sets of SSH keys, e.g.:

- `~/.ssh/personal_key` and `~/.ssh/personal_key.pub`
- `~/.ssh/work_key` and `~/.ssh/work_key.pub`

Now add the SSH keys to their corresponding GitLab accounts. You may follow
[this guide](https://docs.gitlab.com/user/ssh/#add-an-ssh-key-to-your-gitlab-account)
on how to do that.

## Configure SSH to use the correct keys

Now create the file `~/.ssh/config` and add the following contents:

```ini
Host gitlab.com
    HostName gitlab.com
    User git
    IdentityFile ~/.ssh/personal_key

Host gitlab.com-work
    HostName gitlab.com
    User git
    IdentityFile ~/.ssh/work_key
```

This tells SSH to use the `~/.ssh/personal_key` identity by default when
interacting with gitlab.com, unless the host used is "gitlab.com-work" in which
case the `~/.ssh/work_key` identity will be used.

The value for the Host directive can actually be anything, I'm just following a
naming convention of `{original-host}-{username}` to make it more memorable.

## Cloning repositories

When cloning repositories from the `work` account, you'll need to modify the
URL's host to match the value in the SSH config's `Host` directive. For example:

```bash
# Before
$ git clone git@gitlab.com:work/repository.git

# After
$ git clone git@gitlab.com-work:work/repository.git
```

### Updating existing repositories

If you already have a local copy of the repository and you want to update their
remotes to point to your remote work repository, you can do so by updating the
remote's URL like so (assuming your remote's name is `origin`):

```bash
$ git remote set-url origin git@gitlab.com-work:work/repository.git
```

## Set local git configs

When making commits, git will look at the configs to determine the name and
email that it will use as the commit's author. This will most likely end up
being your global git config. To override the global config on a per-project
basis, you can do:

```bash
$ cd work-repository
$ git config user.name "Work Account"
$ git config user.email "work@email.com"
```

Notice the absence of the `--global` flag. These configs will only be set
inside repository in which they were executed. When moving to other
repositories, their local git configs (or the global config if no local config
is set) will be used. This will keep you from having to modify your global git
config every time you go inside a git repository.

**Update Dec 12, 2017 11:02 am:** As pointed out by
[Mary Louise Hermosa](https://medium.com/@jayzces)
[in the responses](https://medium.com/@jayzces/you-can-change-your-global-gitconfig-cc5d0b702f6),
an alternative approach to setting local git configs is to use
"[Conditional Includes](https://git-scm.com/docs/git-config#_conditional_includes)".
To use it, you need to add the following snippet to your `~/.gitconfig` file:

```ini
[includeIf "gitdir:/path/to/work-repository/"]
    [user]
        name = Work Account
        email = work@email.com
```

This dynamically adds/removes git configs based on which git repository you are
on. An advantage of this is that you can manage git configs for different
projects in one central location, the `~/.gitconfig` file.
